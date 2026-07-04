import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { useDemoPipeline } from "@/hooks/useDemoPipeline";
import type { DemoScenarioId } from "@/content/demo-scenarios";
import { DEFAULT_DEMO_SCENARIO, demoScenarioLabel } from "@/content/demo-scenarios";
import type { DemoVoiceId } from "@/content/demo-voices";
import { DEFAULT_DEMO_VOICE } from "@/content/demo-voices";
import { parseDemoErrorResponse } from "@/lib/demo-api";

export type DemoInputMode = "ptt" | "continuous";

export const DEMO_INPUT_MODES: Array<{ value: DemoInputMode; label: string; hint: string }> = [
  {
    value: "ptt",
    label: "Mic switch",
    hint: "Turn the mic on while speaking, then off to send",
  },
  {
    value: "continuous",
    label: "Open mic",
    hint: "Speak naturally — pauses are detected automatically",
  },
];

export const DEMO_LANGUAGES = [
  { value: "hi-IN", label: "Hindi" },
  { value: "gu-IN", label: "Gujarati" },
  { value: "ta-IN", label: "Tamil" },
  { value: "te-IN", label: "Telugu" },
  { value: "mr-IN", label: "Marathi" },
] as const;

type PreflightState = "ok" | "warn" | "fail" | "pending";

export type PreflightItem = {
  id: string;
  label: string;
  state: PreflightState;
  detail: string;
};

type SessionState = "idle" | "connecting" | "live" | "stopping";

const CAPTURE_RATE = 16000;
const PTT_WORKLET = `
  class PttCaptureProcessor extends AudioWorkletProcessor {
    process(inputs) {
      const ch = inputs[0] && inputs[0][0];
      if (ch && ch.length) this.port.postMessage(ch);
      return true;
    }
  }
  registerProcessor("ptt-capture", PttCaptureProcessor);
`;

const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";

const VAD_SPEECH_THRESHOLD = 0.012;
const VAD_SILENCE_MS = 850;
const VAD_MIN_SPEECH_MS = 400;

function ts() {
  return new Date().toISOString().slice(11, 23);
}

function langLabel(code: string) {
  return DEMO_LANGUAGES.find((l) => l.value === code)?.label ?? code;
}

function micErrorMessage(err: unknown) {
  const error = err as { name?: string; message?: string };
  const name = error?.name ?? "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Blocked — allow microphone in the browser prompt or site settings";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No microphone found — plug one in or check system settings";
  }
  if (name === "NotReadableError") {
    return "Microphone in use by another app";
  }
  return error?.message || String(err);
}

function resampleTo16k(samples: Float32Array, fromRate: number) {
  if (fromRate === CAPTURE_RATE) return samples;
  const ratio = fromRate / CAPTURE_RATE;
  const outLen = Math.max(1, Math.floor(samples.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = i * ratio;
    const idx = Math.floor(src);
    const frac = src - idx;
    const a = samples[idx] || 0;
    const b = samples[idx + 1] || a;
    out[i] = a + (b - a) * frac;
  }
  return out;
}

function peakAmplitude(samples: Float32Array) {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  return peak;
}

function encodeWAV(samples: Int16Array, sampleRate: number) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  w(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0, o = 44; i < samples.length; i++, o += 2) {
    v.setInt16(o, samples[i], true);
  }
  return new Uint8Array(buf);
}

async function fetchDemo(url: string, options: RequestInit, ms: number, onUnauthorized: () => void) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal, credentials: "same-origin" });
    if (res.status === 401 || res.status === 403) onUnauthorized();
    return res;
  } finally {
    clearTimeout(timer);
  }
}

type PipelineApi = ReturnType<typeof useDemoPipeline>["pipeline"];

export function useVoiceDemo(pipeline: PipelineApi, onAccessLost: () => void) {
  const [status, setStatus] = useState("Idle.");
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [language, setLanguage] = useState<string>("hi-IN");
  const [scenario, setScenarioState] = useState<DemoScenarioId>(DEFAULT_DEMO_SCENARIO);
  const [voice, setVoiceState] = useState<DemoVoiceId>(DEFAULT_DEMO_VOICE);
  const [inputMode, setInputModeState] = useState<DemoInputMode>("ptt");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [preflight, setPreflight] = useState<PreflightItem[]>([]);
  const [preflightReady, setPreflightReady] = useState(false);
  const [preflightHint, setPreflightHint] = useState("Checking…");
  const [pttLabel, setPttLabel] = useState("Mic off");
  const [micListening, setMicListening] = useState(false);

  const processAudioChunkRef = useRef<(samples: Float32Array) => void>(() => {});
  const roomRef = useRef<Room | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const captureSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const captureNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const captureChunksRef = useRef<Float32Array[]>([]);
  const pttHeldRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const activeLangRef = useRef("hi-IN");
  const activeScenarioRef = useRef<DemoScenarioId>(DEFAULT_DEMO_SCENARIO);
  const activeVoiceRef = useRef<DemoVoiceId>(DEFAULT_DEMO_VOICE);
  const inputModeRef = useRef<DemoInputMode>("ptt");
  const vadSpeakingRef = useRef(false);
  const vadSilenceMsRef = useRef(0);
  const vadSpeechMsRef = useRef(0);
  const sendingRef = useRef(false);
  const agentJoinedRef = useRef(false);
  const agentJoinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioUnlockedRef = useRef(false);
  const speakQueueRef = useRef(Promise.resolve());
  const preflightRunningRef = useRef(false);
  const stopInProgressRef = useRef(false);
  const transcriptRef = useRef<string[]>([]);
  const sessionLogIdRef = useRef("");
  const roomNameRef = useRef("");

  const addLine = useCallback((text: string) => {
    setTranscript((prev) => {
      const next = [...prev, `[${ts()}] ${text}`];
      transcriptRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const onUnauthorized = useCallback(() => {
    onAccessLost();
  }, [onAccessLost]);

  const persistTranscript = useCallback(
    async (status: string, extraLines: string[] = []) => {
      const lines = [...transcriptRef.current, ...extraLines].filter(Boolean);
      if (!lines.length || !sessionLogIdRef.current || !roomNameRef.current) return;
      try {
        const res = await fetchDemo(
          "/demo/transcript-log",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: sessionLogIdRef.current,
              roomName: roomNameRef.current,
              language: activeLangRef.current,
              scenario: activeScenarioRef.current,
              voice: activeVoiceRef.current,
              inputMode: inputModeRef.current,
              status,
              lines,
            }),
          },
          15000,
          onUnauthorized,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { saved?: boolean; filePath?: string };
        if (data.saved) {
          addLine(`system: transcript logged${data.filePath ? ` (${data.filePath})` : ""}`);
        }
      } catch {
        /* best-effort — demo UX should not break on log failure */
      }
    },
    [addLine, onUnauthorized],
  );

  const micTrackLabel = useCallback((stream: MediaStream | null) => {
    const track = stream?.getAudioTracks?.()[0];
    if (!track) return "Microphone ready";
    return track.label?.trim() || "Microphone ready";
  }, []);

  const acquireMicStream = useCallback(async () => {
    if (micStreamRef.current?.active) return micStreamRef.current;
    micStreamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    return micStreamRef.current;
  }, []);

  const unlockAudio = useCallback(async () => {
    if (audioUnlockedRef.current || !audioRef.current) return;
    const audioEl = audioRef.current;
    audioEl.muted = false;
    audioEl.volume = 1;
    audioEl.src = SILENT_WAV;
    try {
      await Promise.race([
        audioEl.play(),
        new Promise((_, rej) => setTimeout(() => rej(new Error("unlock timeout")), 500)),
      ]);
    } catch {
      /* user gesture on Start is enough for most browsers */
    }
    audioUnlockedRef.current = true;
  }, []);

  const ensureCapture = useCallback(async () => {
    if (!micStreamRef.current || captureCtxRef.current) return;
    captureCtxRef.current = new AudioContext({ sampleRate: CAPTURE_RATE });
    if (captureCtxRef.current.state === "suspended") {
      await captureCtxRef.current.resume();
    }
    captureSourceRef.current = captureCtxRef.current.createMediaStreamSource(micStreamRef.current);
    const routeChunk = (samples: Float32Array) => processAudioChunkRef.current(samples);
    try {
      const blob = new Blob([PTT_WORKLET], { type: "application/javascript" });
      await captureCtxRef.current.audioWorklet.addModule(URL.createObjectURL(blob));
      captureNodeRef.current = new AudioWorkletNode(captureCtxRef.current, "ptt-capture");
      (captureNodeRef.current as AudioWorkletNode).port.onmessage = (e) => {
        routeChunk(new Float32Array(e.data));
      };
    } catch {
      const processor = captureCtxRef.current.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        routeChunk(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      captureNodeRef.current = processor;
    }
    captureSourceRef.current.connect(captureNodeRef.current);
    captureNodeRef.current.connect(captureCtxRef.current.destination);
  }, []);

  const publishSignal = useCallback((payload: object) => {
    const room = roomRef.current;
    if (!room) return;
    room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(payload)), {
      reliable: true,
    });
  }, []);

  const playTTS = useCallback(
    async (text: string, lang: string) => {
      const res = await fetchDemo(
        "/demo/tts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, lang, speaker: activeVoiceRef.current }),
        },
        60000,
        onUnauthorized,
      );
      if (!res.ok) throw new Error((await res.text()).trim() || `TTS HTTP ${res.status}`);
      const blob = await res.blob();
      if (!blob.size) throw new Error("empty TTS audio");
      const audioEl = audioRef.current;
      if (!audioEl) return;
      if (audioEl.src?.startsWith("blob:")) URL.revokeObjectURL(audioEl.src);
      audioEl.src = URL.createObjectURL(blob);
      audioEl.muted = false;
      await audioEl.play();
    },
    [onUnauthorized],
  );

  const speakAgent = useCallback(
    (text: string, lang?: string) => {
      if (!text) return;
      speakQueueRef.current = speakQueueRef.current
        .then(() => playTTS(text, lang || activeLangRef.current))
        .catch((e) => addLine(`system: voice — ${e instanceof Error ? e.message : String(e)}`));
    },
    [addLine, playTTS],
  );

  const stopPlayback = useCallback(() => {
    speakQueueRef.current = Promise.resolve();
    const audioEl = audioRef.current;
    if (!audioEl) return;
    try {
      audioEl.pause();
      if (audioEl.src?.startsWith("blob:")) URL.revokeObjectURL(audioEl.src);
      audioEl.removeAttribute("src");
      audioEl.load();
    } catch {
      /* ignore */
    }
  }, []);

  const resetVad = useCallback(() => {
    vadSpeakingRef.current = false;
    vadSilenceMsRef.current = 0;
    vadSpeechMsRef.current = 0;
    captureChunksRef.current = [];
  }, []);

  const micHintForMode = useCallback((mode: DemoInputMode) => {
    return mode === "continuous" ? "Speak naturally" : "Mic off";
  }, []);

  const teardown = useCallback(() => {
    sessionActiveRef.current = false;
    pttHeldRef.current = false;
    setMicListening(false);
    sendingRef.current = false;
    resetVad();
    agentJoinedRef.current = false;
    if (agentJoinTimerRef.current) clearTimeout(agentJoinTimerRef.current);
    agentJoinTimerRef.current = null;
    captureChunksRef.current = [];
    captureNodeRef.current?.disconnect();
    captureSourceRef.current?.disconnect();
    captureCtxRef.current?.close().catch(() => {});
    captureNodeRef.current = null;
    captureSourceRef.current = null;
    captureCtxRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    stopPlayback();
    setPttLabel(micHintForMode(inputModeRef.current));
  }, [micHintForMode, resetVad, stopPlayback]);

  const disconnectRoom = useCallback(async (room: Room | null, timeoutMs = 5000) => {
    if (!room) return;
    await Promise.race([
      room.disconnect().catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
    try {
      room.removeAllListeners?.();
    } catch {
      /* ignore */
    }
  }, []);

  const runPreflight = useCallback(
    async ({ interactive = false } = {}) => {
      preflightRunningRef.current = true;
      setPreflightHint("Checking…");

      const checks: Array<{
        id: string;
        label: string;
        run: (interactive: boolean) => Promise<{ state: PreflightState; detail: string }>;
      }> = [
        {
          id: "secure",
          label: "Secure page",
          run: async () => {
            if (window.isSecureContext) return { state: "ok", detail: "HTTPS or trusted localhost" };
            const host = location.hostname;
            if (host === "localhost" || host === "127.0.0.1") {
              return { state: "ok", detail: "Local development (HTTP)" };
            }
            return { state: "fail", detail: `Use https://${host}/demo` };
          },
        },
        {
          id: "livekit",
          label: "LiveKit client",
          run: async () => ({ state: "ok", detail: "Loaded" }),
        },
        {
          id: "server",
          label: "Platform API",
          run: async () => {
            try {
              const res = await fetch("/health", { cache: "no-store" });
              if (!res.ok) return { state: "fail", detail: `API returned HTTP ${res.status}` };
              return { state: "ok", detail: "Reachable" };
            } catch {
              return { state: "fail", detail: "Cannot reach platform — run task dev" };
            }
          },
        },
        {
          id: "mic-api",
          label: "Microphone API",
          run: async () =>
            typeof navigator.mediaDevices?.getUserMedia === "function"
              ? { state: "ok", detail: "Supported by this browser" }
              : { state: "fail", detail: "Browser does not expose getUserMedia" },
        },
        {
          id: "mic-permission",
          label: "Microphone permission",
          run: async (isInteractive) => {
            if (micStreamRef.current?.active) {
              return { state: "ok", detail: micTrackLabel(micStreamRef.current) };
            }
            if (isInteractive) {
              try {
                await acquireMicStream();
                return { state: "ok", detail: micTrackLabel(micStreamRef.current) };
              } catch (err) {
                return { state: "fail", detail: micErrorMessage(err) };
              }
            }
            return { state: "warn", detail: "Allow when you click Start demo" };
          },
        },
        {
          id: "mic-device",
          label: "Microphone device",
          run: async () => {
            if (!navigator.mediaDevices?.enumerateDevices) {
              return { state: "warn", detail: "Cannot list devices until permission is granted" };
            }
            const devices = await navigator.mediaDevices.enumerateDevices();
            const mics = devices.filter((d) => d.kind === "audioinput");
            if (mics.length === 0) return { state: "fail", detail: "No audio input devices detected" };
            const named = mics.find((d) => d.label?.trim());
            if (named) return { state: "ok", detail: named.label! };
            return { state: "warn", detail: `${mics.length} device(s) — name shown after mic access` };
          },
        },
        {
          id: "speaker",
          label: "Speaker playback",
          run: async (isInteractive) => {
            if (isInteractive) await unlockAudio();
            return audioUnlockedRef.current
              ? { state: "ok", detail: "Unlocked for agent voice" }
              : { state: "warn", detail: "Unlocks when you click Start demo" };
          },
        },
      ];

      const results: PreflightItem[] = [];
      let ready = true;

      for (const check of checks) {
        let state: PreflightState = "pending";
        let detail = "Checking…";
        try {
          const out = await check.run(interactive);
          state = out.state;
          detail = out.detail;
        } catch (err) {
          state = "fail";
          detail = err instanceof Error ? err.message : String(err);
        }
        if (state === "fail") ready = false;
        results.push({ id: check.id, label: check.label, state, detail });
      }

      if (interactive && micStreamRef.current?.active) {
        try {
          await ensureCapture();
        } catch (err) {
          ready = false;
          const micRow = results.find((r) => r.id === "mic-permission");
          if (micRow) {
            micRow.state = "fail";
            micRow.detail = `Capture setup failed — ${err instanceof Error ? err.message : err}`;
          }
        }
      }

      preflightRunningRef.current = false;
      setPreflight(results);
      setPreflightReady(ready);
      const hasFail = results.some((r) => r.state === "fail");
      if (hasFail) {
        setPreflightHint("Fix the failed items above, then click Check again.");
      } else if (ready) {
        setPreflightHint("All checks passed — click Start demo.");
      } else {
        setPreflightHint("Click Start demo — microphone and speaker are confirmed when you start.");
      }
      return ready;
    },
    [acquireMicStream, ensureCapture, micTrackLabel, unlockAudio],
  );

  const captureWAV = useCallback(() => {
    const chunks = captureChunksRef.current;
    if (!chunks.length) return null;
    let n = 0;
    for (const c of chunks) n += c.length;
    const merged = new Float32Array(n);
    for (let i = 0, o = 0; i < chunks.length; i++) {
      merged.set(chunks[i], o);
      o += chunks[i].length;
    }
    captureChunksRef.current = [];
    const fromRate = captureCtxRef.current?.sampleRate || CAPTURE_RATE;
    const resampled = resampleTo16k(merged, fromRate);
    const peak = peakAmplitude(resampled);
    const pcm = new Int16Array(resampled.length);
    for (let i = 0; i < resampled.length; i++) {
      const s = Math.max(-1, Math.min(1, resampled[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return {
      wav: encodeWAV(pcm, CAPTURE_RATE),
      peak,
      durationMs: (resampled.length / CAPTURE_RATE) * 1000,
    };
  }, []);

  const sendCapturedUtterance = useCallback(async () => {
    if (sendingRef.current) return;
    const captured = captureWAV();
    resetVad();
    if (!captured) return;

    const { wav, peak, durationMs } = captured;
    const minPttMs = 450;
    if (peak < 0.008 || (inputModeRef.current === "ptt" && durationMs < minPttMs)) {
      if (inputModeRef.current === "ptt") {
        addLine("system: no audio — keep mic on longer while speaking");
      }
      setStatus(`Connected · ${langLabel(activeLangRef.current)}`);
      return;
    }

    sendingRef.current = true;
    setStatus("Transcribing…");
    try {
      const res = await fetchDemo(
        `/demo/transcribe?lang=${encodeURIComponent(activeLangRef.current)}`,
        { method: "POST", headers: { "Content-Type": "audio/wav" }, body: wav },
        60000,
        onUnauthorized,
      );
      if (!res.ok) throw new Error(await res.text());
      const { text } = (await res.json()) as { text: string };
      const line = (text || "").trim();
      if (!line) {
        addLine("system: could not understand — try again with mic on a little longer");
      } else {
        publishSignal({ type: "utterance", text: line });
      }
    } catch (err) {
      addLine(`system: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      sendingRef.current = false;
      setPttLabel(micHintForMode(inputModeRef.current));
      setStatus(`Connected · ${langLabel(activeLangRef.current)}`);
    }
  }, [addLine, captureWAV, micHintForMode, onUnauthorized, publishSignal, resetVad]);

  processAudioChunkRef.current = (samples: Float32Array) => {
    if (!sessionActiveRef.current) return;
    const sampleRate = captureCtxRef.current?.sampleRate || CAPTURE_RATE;
    const chunkMs = (samples.length / sampleRate) * 1000;
    const peak = peakAmplitude(samples);

    if (inputModeRef.current === "ptt") {
      if (pttHeldRef.current) captureChunksRef.current.push(samples);
      return;
    }

    if (sendingRef.current) return;

    if (peak >= VAD_SPEECH_THRESHOLD) {
      vadSpeakingRef.current = true;
      vadSilenceMsRef.current = 0;
      vadSpeechMsRef.current += chunkMs;
      captureChunksRef.current.push(samples);
      setPttLabel("Listening…");
      return;
    }

    if (vadSpeakingRef.current) {
      vadSilenceMsRef.current += chunkMs;
      captureChunksRef.current.push(samples);
      if (
        vadSilenceMsRef.current >= VAD_SILENCE_MS &&
        vadSpeechMsRef.current >= VAD_MIN_SPEECH_MS
      ) {
        void sendCapturedUtterance();
      }
    }
  };

  const start = useCallback(async () => {
    if (sessionActiveRef.current) return;
    const ready = await runPreflight({ interactive: true });
    if (!ready) {
      setStatus("Fix the checklist above, then try again.");
      addLine("system: prerequisites not met — see Before you start");
      return;
    }

    setSessionState("connecting");
    setStatus("Starting…");
    setTranscript([]);
    transcriptRef.current = [];
    sessionLogIdRef.current = crypto.randomUUID();
    roomNameRef.current = "";
    activeLangRef.current = language;
    activeScenarioRef.current = scenario;
    activeVoiceRef.current = voice;
    inputModeRef.current = inputMode;
    resetVad();
    setPttLabel(micHintForMode(inputMode));
    pipeline.onStart();

    let session: {
      url: string;
      token: string;
      roomName: string;
      dispatchOk: boolean;
      dispatchHint?: string | null;
    };
    try {
      const res = await fetchDemo(
        `/demo/session?lang=${encodeURIComponent(language)}&scenario=${encodeURIComponent(scenario)}`,
        { method: "POST" },
        30000,
        onUnauthorized,
      );
      if (!res.ok) throw new Error(await parseDemoErrorResponse(res));
      session = await res.json();
    } catch (e) {
      setSessionState("idle");
      setStatus("Failed to start.");
      addLine(`system: ${e instanceof Error ? e.message : String(e)}`);
      pipeline.onError("dispatch");
      sessionLogIdRef.current = "";
      return;
    }

    roomNameRef.current = session.roomName;

    pipeline.onSessionCreated();
    sessionActiveRef.current = true;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    room.on(RoomEvent.Disconnected, () => {
      if (stopInProgressRef.current) return;
      teardown();
      roomRef.current = null;
      setSessionState("idle");
      setStatus("Idle.");
      pipeline.onStop();
    });

    room.on(RoomEvent.ParticipantConnected, (p) => {
      if (!p.identity?.startsWith("agent-")) return;
      agentJoinedRef.current = true;
      if (agentJoinTimerRef.current) clearTimeout(agentJoinTimerRef.current);
      pipeline.onAgentJoined();
      setStatus(`Connected · ${langLabel(activeLangRef.current)} · toggle mic to speak`);
    });

    room.on(RoomEvent.DataReceived, (payload) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === "user_text" && msg.text) addLine(`you: ${msg.text}`);
        if (msg.type === "demo_complete") {
          const summary =
            msg.answer != null && String(msg.answer).trim()
              ? String(msg.answer)
              : [msg.reason, msg.reschedule].filter(Boolean).join(" · ");
          const completeLine = `system: done — ${demoScenarioLabel(String(msg.scenario || scenario))}: ${summary || "—"}`;
          addLine(completeLine);
          setStatus("Complete.");
          pipeline.onComplete();
          void persistTranscript("completed");
        }
        if (msg.type === "agent_text" && msg.text) {
          addLine(`agent: ${msg.text}`);
          speakAgent(msg.text, msg.lang);
        }
      } catch {
        /* ignore */
      }
    });

    pipeline.onConnecting();
    try {
      await Promise.race([
        room.connect(session.url, session.token, { autoSubscribe: true }),
        new Promise((_, rej) => setTimeout(() => rej(new Error("LiveKit timeout")), 30000)),
      ]);
    } catch (e) {
      sessionActiveRef.current = false;
      setSessionState("idle");
      setStatus("Connection failed.");
      addLine(`system: ${e instanceof Error ? e.message : String(e)}`);
      await disconnectRoom(room);
      roomRef.current = null;
      pipeline.onError("reach");
      return;
    }

    setSessionState("live");
    publishSignal({ type: "set_language", lang: activeLangRef.current });

    for (const p of room.remoteParticipants.values()) {
      if (p.identity?.startsWith("agent-")) {
        agentJoinedRef.current = true;
        pipeline.onAgentJoined();
        break;
      }
    }

    if (!micStreamRef.current?.active) {
      addLine("system: microphone lost — run Check again");
      setStatus("Microphone unavailable.");
    } else if (!captureCtxRef.current) {
      try {
        await ensureCapture();
      } catch (e) {
        addLine(`system: mic capture failed — ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (!session.dispatchOk) {
      addLine(`system: ${session.dispatchHint || "Agent dispatch failed"}`);
    } else if (!agentJoinedRef.current) {
      agentJoinTimerRef.current = setTimeout(() => {
        if (!agentJoinedRef.current && sessionActiveRef.current) {
          addLine("system: agent not joined — start the Soniqa agent and check logs");
          setStatus("Waiting for agent…");
        }
      }, 20000);
    }
    setStatus(
      agentJoinedRef.current
        ? `Connected · ${langLabel(activeLangRef.current)}`
        : "Waiting for agent…",
    );
  }, [
    addLine,
    disconnectRoom,
    ensureCapture,
    language,
    scenario,
    voice,
    inputMode,
    onUnauthorized,
    micHintForMode,
    pipeline,
    publishSignal,
    resetVad,
    runPreflight,
    speakAgent,
    teardown,
    persistTranscript,
  ]);

  const stop = useCallback(async () => {
    if (!sessionActiveRef.current && !roomRef.current) return;
    if (stopInProgressRef.current) return;
    stopInProgressRef.current = true;
    setSessionState("stopping");
    setStatus("Stopping…");
    const activeRoom = roomRef.current;
    roomRef.current = null;
    teardown();
    try {
      await disconnectRoom(activeRoom);
    } finally {
      stopInProgressRef.current = false;
      setSessionState("idle");
      setStatus("Idle.");
      pipeline.onStop();
      void persistTranscript("stopped");
      void runPreflight({ interactive: false });
    }
  }, [disconnectRoom, persistTranscript, pipeline, runPreflight, teardown]);

  const startMicListening = useCallback(async () => {
    if (!sessionActiveRef.current || pttHeldRef.current || sendingRef.current) return;
    if (captureCtxRef.current?.state === "suspended") {
      await captureCtxRef.current.resume().catch(() => {});
    }
    pttHeldRef.current = true;
    captureChunksRef.current = [];
    setMicListening(true);
    setPttLabel("Listening…");
  }, []);

  const stopMicListening = useCallback(async () => {
    if (!sessionActiveRef.current || !pttHeldRef.current) return;
    pttHeldRef.current = false;
    setMicListening(false);
    setPttLabel(micHintForMode("ptt"));
    await sendCapturedUtterance();
  }, [micHintForMode, sendCapturedUtterance]);

  const toggleMic = useCallback(async () => {
    if (pttHeldRef.current) {
      await stopMicListening();
    } else {
      await startMicListening();
    }
  }, [startMicListening, stopMicListening]);

  const onScenarioChange = useCallback(
    (next: string) => {
      const id = next as DemoScenarioId;
      setScenarioState(id);
      if (id === activeScenarioRef.current) return;
      activeScenarioRef.current = id;
      addLine(`system: scenario — ${demoScenarioLabel(id)}`);
    },
    [addLine],
  );

  const onVoiceChange = useCallback((next: string) => {
    const id = next as DemoVoiceId;
    setVoiceState(id);
    activeVoiceRef.current = id;
  }, []);

  const onInputModeChange = useCallback(
    (next: string) => {
      const mode = next as DemoInputMode;
      if (mode !== "ptt" && pttHeldRef.current) {
        pttHeldRef.current = false;
        setMicListening(false);
        captureChunksRef.current = [];
      }
      setInputModeState(mode);
      inputModeRef.current = mode;
      setPttLabel(micHintForMode(mode));
    },
    [micHintForMode],
  );

  const onLanguageChange = useCallback(
    (lang: string) => {
      setLanguage(lang);
      if (lang === activeLangRef.current) return;
      activeLangRef.current = lang;
      addLine(`system: ${langLabel(lang)}`);
      publishSignal({ type: "set_language", lang });
    },
    [addLine, publishSignal],
  );

  const copyTranscript = useCallback(async () => {
    const text = transcript.join("\n");
    if (!text) {
      addLine("system: nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      addLine("system: transcript copied");
    } catch (e) {
      addLine(`system: copy failed — ${e instanceof Error ? e.message : String(e)}`);
    }
  }, [addLine, transcript]);

  useEffect(() => {
    void runPreflight({ interactive: false });
    return () => {
      if (sessionActiveRef.current) teardown();
      void disconnectRoom(roomRef.current);
    };
  }, [disconnectRoom, runPreflight, teardown]);

  const canStart =
    preflightReady && sessionState === "idle" && !preflightRunningRef.current;
  const isLive = sessionState === "live";

  return {
    status,
    sessionState,
    language,
    scenario,
    voice,
    inputMode,
    transcript,
    preflight,
    preflightHint,
    pttLabel,
    micListening,
    canStart,
    isLive,
    audioRef,
    setLanguage: onLanguageChange,
    setScenario: onScenarioChange,
    setVoice: onVoiceChange,
    setInputMode: onInputModeChange,
    start,
    stop,
    toggleMic,
    copyTranscript,
    recheck: () => runPreflight({ interactive: true }),
  };
}
