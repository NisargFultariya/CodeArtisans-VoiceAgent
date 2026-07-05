import { useState, useEffect, useRef, useCallback } from "react";

export type CallProgressStatus =
  | "idle"
  | "scheduled"
  | "dialing"
  | "ringing"
  | "connected"
  | "speaking"
  | "listening"
  | "completed"
  | "failed"
  | "cancelled";

export function useOutboundCall() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [scenario, setScenario] = useState("recovery");
  const [language, setLanguage] = useState("hi-IN");
  const [voice, setVoice] = useState("priya");
  
  // Scheduling States
  const [scheduleMode, setScheduleMode] = useState<"immediate" | "minutes" | "custom">("immediate");
  const [delayMinutes, setDelayMinutes] = useState(5);
  const [customTime, setCustomTime] = useState("");
  
  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<CallProgressStatus>("idle");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [duration, setDuration] = useState<number | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setStatus("idle");
    setCallId(null);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript([]);
    setDuration(null);
    setRecordingUrl(null);
    setSummary(null);
    
    if (!phoneNumber.trim()) {
      setError("Please enter a valid phone number.");
      return;
    }
    
    const isScheduled = scheduleMode !== "immediate";
    setStatus(isScheduled ? "scheduled" : "dialing");
    
    try {
      const payload: any = {
        phoneNumber: phoneNumber.trim(),
        scenario,
        language,
        voice,
        mode: "phone"
      };

      if (scheduleMode === "minutes") {
        payload.delayMinutes = delayMinutes;
      } else if (scheduleMode === "custom" && customTime) {
        payload.scheduledTimeEpochMs = new Date(customTime).getTime();
      }

      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to place call (HTTP ${response.status})`);
      }
      
      const data = await response.json();
      setCallId(data.callId);
      
      // Start listening to SSE stream
      const sse = new EventSource("/api/calls/stream");
      eventSourceRef.current = sse;
      
      sse.addEventListener("call-update", (event: any) => {
        try {
          const update = JSON.parse(event.data);
          if (update.callId !== data.callId) return;
          
          const rawStatus = update.status;
          
          if (rawStatus === "SCHEDULED") setStatus("scheduled");
          else if (rawStatus === "CALLING") setStatus("dialing");
          else if (rawStatus === "RINGING") setStatus("ringing");
          else if (rawStatus === "AGENT_JOINED") setStatus("ringing");
          else if (rawStatus === "CONNECTED") setStatus("connected");
          else if (rawStatus === "COMPLETED") {
            setStatus("completed");
            sse.close();
          } else if (rawStatus === "FAILED") {
            setStatus("failed");
            setError(update.data?.outcome || "Call failed");
            sse.close();
          } else if (rawStatus === "CANCELLED") {
            setStatus("cancelled");
            sse.close();
          }
          
          if (update.data?.transcript) {
            const lines = update.data.transcript.split("\n").filter(Boolean);
            setTranscript(lines);
          }
          if (update.data?.durationSeconds != null) {
            setDuration(update.data.durationSeconds);
          }
          if (update.data?.outcome) {
            setSummary(update.data.outcome);
          }
        } catch (e) {
          console.error("Error parsing SSE call-update event:", e);
        }
      });
      
      sse.addEventListener("error", () => {
        console.warn("SSE disconnected or failed.");
      });
      
    } catch (err: any) {
      setStatus("failed");
      setError(err.message || "Failed to start call session.");
    }
  }, [phoneNumber, scenario, language, voice, scheduleMode, delayMinutes, customTime]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    phoneNumber,
    setPhoneNumber,
    scenario,
    setScenario,
    language,
    setLanguage,
    voice,
    setVoice,
    scheduleMode,
    setScheduleMode,
    delayMinutes,
    setDelayMinutes,
    customTime,
    setCustomTime,
    callId,
    status,
    transcript,
    duration,
    recordingUrl,
    summary,
    error,
    start,
    stop
  };
}
