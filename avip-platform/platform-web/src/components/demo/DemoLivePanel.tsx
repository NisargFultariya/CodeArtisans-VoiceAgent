import { useState } from "react";
import { DemoFlowRail } from "@/components/demo/DemoFlowRail";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEMO_SCENARIOS } from "@/content/demo-scenarios";
import { DEMO_VOICES } from "@/content/demo-voices";
import { useDemoPipeline } from "@/hooks/useDemoPipeline";
import {
  DEMO_INPUT_MODES,
  DEMO_LANGUAGES,
  useVoiceDemo,
} from "@/hooks/useVoiceDemo";
import { useOutboundCall, type CallProgressStatus } from "@/hooks/useOutboundCall";
import { cn } from "@/lib/utils";
import { Copy, Mic, Play, RefreshCw, Square, Phone, PhoneCall, Volume2, FileText, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

type DemoLivePanelProps = {
  onAccessLost: () => void;
};

function PreflightDot({ state }: { state: string }) {
  return (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full",
        state === "ok" && "bg-emerald-500",
        state === "fail" && "bg-red-500",
        state === "warn" && "bg-amber-500",
        state !== "ok" && state !== "fail" && state !== "warn" && "bg-slate-300",
      )}
    />
  );
}

const selectTriggerClass =
  "h-9 w-full border-slate-200 bg-white text-sm text-slate-900 shadow-sm";

export function DemoLivePanel({ onAccessLost }: DemoLivePanelProps) {
  const [dialMode, setDialMode] = useState<"browser" | "phone">("phone");

  // Hook for browser demo mode
  const { stepStates, pipeline } = useDemoPipeline();
  const demo = useVoiceDemo(pipeline, onAccessLost);

  // Hook for outbound phone call mode
  const phoneCall = useOutboundCall();

  const isBrowserActive = demo.isLive || demo.sessionState === "connecting";
  const isPhoneActive = phoneCall.status !== "idle";
  const locked = isBrowserActive || isPhoneActive;

  const startLabel =
    demo.sessionState === "connecting" ? "Connecting…" : demo.isLive ? "Live" : "Start demo";

  function copyText(textList: string[]) {
    navigator.clipboard.writeText(textList.join("\n"));
  }

  // SSE Phone calling state steps
  const phoneSteps: Array<{ key: CallProgressStatus; label: string; desc: string }> = [];
  if (phoneCall.status === "scheduled") {
    phoneSteps.push({ key: "scheduled", label: "Scheduled", desc: "Temporal call scheduled" });
  }
  phoneSteps.push(
    { key: "dialing", label: "Dialing", desc: "Placing call via LiveKit SIP" },
    { key: "ringing", label: "Ringing", desc: "Recipient phone is ringing" },
    { key: "connected", label: "Connected", desc: "Agent and recipient talking" },
    { key: "completed", label: "Completed", desc: "Call ended and processed" }
  );

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-4xl flex-col p-4 md:p-6">
      {/* Dial Mode Toggle */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex rounded-xl bg-slate-100 p-1 shadow-inner">
          <button
            type="button"
            disabled={locked}
            onClick={() => setDialMode("phone")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              dialMode === "phone"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-950 disabled:opacity-50"
            )}
          >
            <Phone className="size-4" />
            Outbound Phone
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => setDialMode("browser")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              dialMode === "browser"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-950 disabled:opacity-50"
            )}
          >
            <Mic className="size-4" />
            Browser Demo
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Config Header */}
        <header className="shrink-0 border-b border-slate-100 px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link to="/" className="text-lg font-semibold text-indigo-700 hover:text-indigo-800">
                AVIP Calling Platform
              </Link>
              <p className="mt-0.5 text-sm text-slate-500">
                {dialMode === "phone"
                  ? "Place outbound PSTN calls using LiveKit & Twilio"
                  : "Try Soniqa recovery agent directly in your browser"}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
              <span
                className={cn(
                  "size-2 rounded-full",
                  locked ? "animate-pulse bg-emerald-500" : "bg-slate-300",
                )}
              />
              {dialMode === "phone" ? `Outbound: ${phoneCall.status.toUpperCase()}` : `Browser: ${demo.status}`}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {dialMode === "phone" ? (
              <>
                <label className="space-y-1.5 col-span-1">
                  <span className="text-xs font-medium text-slate-600">Phone Number</span>
                  <Input
                    type="tel"
                    disabled={locked}
                    value={phoneCall.phoneNumber}
                    onChange={(e) => phoneCall.setPhoneNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="h-9 border-slate-200 bg-white text-sm"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-slate-600">Schedule</span>
                  <Select
                    value={phoneCall.scheduleMode}
                    onValueChange={(v) => v && phoneCall.setScheduleMode(v as any)}
                    disabled={locked}
                  >
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate call</SelectItem>
                      <SelectItem value="minutes">In minutes</SelectItem>
                      <SelectItem value="custom">Custom time</SelectItem>
                    </SelectContent>
                  </Select>
                </label>

                {phoneCall.scheduleMode === "minutes" && (
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">Delay</span>
                    <Select
                      value={String(phoneCall.delayMinutes)}
                      onValueChange={(v) => v && phoneCall.setDelayMinutes(Number(v))}
                      disabled={locked}
                    >
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 minute</SelectItem>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                )}

                {phoneCall.scheduleMode === "custom" && (
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-slate-600">Custom Time</span>
                    <Input
                      type="datetime-local"
                      disabled={locked}
                      value={phoneCall.customTime}
                      onChange={(e) => phoneCall.setCustomTime(e.target.value)}
                      className="h-9 border-slate-200 bg-white text-sm"
                    />
                  </label>
                )}
              </>
            ) : (
              <label className="space-y-1.5 col-span-1">
                <span className="text-xs font-medium text-slate-600">Mic mode</span>
                <Select
                  value={demo.inputMode}
                  onValueChange={(v) => v && demo.setInputMode(v)}
                  disabled={locked}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_INPUT_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            )}

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-slate-600">Scenario</span>
              <Select
                value={dialMode === "phone" ? phoneCall.scenario : demo.scenario}
                onValueChange={(v) => {
                  if (v) {
                    if (dialMode === "phone") phoneCall.setScenario(v);
                    else demo.setScenario(v as any);
                  }
                }}
                disabled={locked}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_SCENARIOS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-slate-600">Language</span>
              <Select
                value={dialMode === "phone" ? phoneCall.language : demo.language}
                onValueChange={(v) => {
                  if (v) {
                    if (dialMode === "phone") phoneCall.setLanguage(v);
                    else demo.setLanguage(v);
                  }
                }}
                disabled={locked}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-slate-600">Agent voice</span>
              <Select
                value={dialMode === "phone" ? phoneCall.voice : demo.voice}
                onValueChange={(v) => {
                  if (v) {
                    if (dialMode === "phone") phoneCall.setVoice(v);
                    else demo.setVoice(v as any);
                  }
                }}
                disabled={locked}
              >
                <SelectTrigger className={selectTriggerClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_VOICES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label} — {v.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        </header>

        {/* State Steps Rail */}
        {dialMode === "browser" ? (
          <DemoFlowRail stepStates={stepStates} />
        ) : (
          <div className="shrink-0 border-b border-slate-100 bg-slate-50/50 px-4 py-3 md:px-6">
            <div className="flex justify-between max-w-lg mx-auto">
              {phoneSteps.map((step, idx) => {
                const isCurrent = phoneCall.status === step.key || 
                  (step.key === "connected" && (phoneCall.status === "speaking" || phoneCall.status === "listening"));
                
                const isPassed = (() => {
                  const statesList = phoneCall.status === "scheduled"
                    ? ["scheduled", "dialing", "ringing", "connected", "completed"]
                    : ["dialing", "ringing", "connected", "completed"];
                  
                  const resolvedStatus = phoneCall.status === "speaking" || phoneCall.status === "listening" ? "connected" : phoneCall.status;
                  const currentIdx = statesList.indexOf(resolvedStatus);
                  const stepIdx = statesList.indexOf(step.key);
                  
                  return currentIdx > stepIdx || phoneCall.status === "completed";
                })();

                return (
                  <div key={step.key} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-xs font-semibold border transition-all",
                        isCurrent && "bg-indigo-600 text-white border-indigo-600 scale-110",
                        isPassed && "bg-emerald-500 text-white border-emerald-500",
                        !isCurrent && !isPassed && "bg-white text-slate-400 border-slate-200"
                      )}
                    >
                      {isPassed ? "✓" : idx + 1}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium hidden sm:inline",
                        isCurrent && "text-indigo-900 font-bold",
                        isPassed && "text-emerald-700",
                        !isCurrent && !isPassed && "text-slate-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4 md:p-5">
          {/* Active Call Summary Meta */}
          {dialMode === "phone" && phoneCall.status === "completed" && (
            <div className="shrink-0 grid gap-3 grid-cols-1 sm:grid-cols-3 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
              <div className="flex items-center gap-2">
                <Volume2 className="size-4 text-emerald-600" />
                <span className="font-semibold">Duration:</span>
                <span>{phoneCall.duration ? `${Math.floor(phoneCall.duration / 60)}m ${phoneCall.duration % 60}s` : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-emerald-600" />
                <span className="font-semibold">Outcome:</span>
                <span>{phoneCall.summary || "Completed"}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-emerald-600" />
                <span className="font-semibold">Recording:</span>
                <span>Available in Call History</span>
              </div>
            </div>
          )}

          {dialMode === "phone" && phoneCall.error && (
            <p className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-950">
              {phoneCall.error}
            </p>
          )}

          {dialMode === "browser" && !demo.preflight.every((item) => item.state !== "fail") ? (
            <p className="shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              {demo.preflightHint}
            </p>
          ) : null}

          {/* Transcript Log Panel */}
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="shrink-0 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-medium text-slate-800">Live Call Transcript</h2>
                <p className="text-xs text-slate-500">
                  {locked ? "Conversing with recipient..." : "Setup parameters above to start"}
                </p>
              </div>
              {locked && dialMode === "phone" && (
                <div className="animate-pulse flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-600" />
                  Live Audio
                </div>
              )}
            </div>
            <ScrollArea className="h-0 min-h-0 flex-1">
              <div className="p-4">
                {dialMode === "phone" ? (
                  phoneCall.transcript.length === 0 ? (
                    <p className="text-sm leading-relaxed text-slate-500">
                      Transcript will populate here in real-time as the voice assistant speaks and listens.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {phoneCall.transcript.map((line, index) => {
                        const isAgent = line.startsWith("[agent]") || line.includes("agent:");
                        const isSystem = line.startsWith("[system]") || line.includes("system:");
                        
                        let cleanLine = line.replace(/^\[(agent|user|system)\]\s*/i, "");
                        cleanLine = cleanLine.replace(/^(agent|you|system):\s*/i, "");

                        return (
                          <div
                            key={index}
                            className={cn(
                              "flex flex-col max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                              isAgent && "bg-indigo-50 text-indigo-950 mr-auto rounded-tl-none",
                              isSystem && "bg-amber-50 text-amber-900 mx-auto text-center border border-amber-100",
                              !isAgent && !isSystem && "bg-slate-100 text-slate-900 ml-auto rounded-tr-none"
                            )}
                          >
                            <span className="text-[10px] font-semibold opacity-60 mb-0.5">
                              {isAgent ? "SONIQA (AGENT)" : isSystem ? "SYSTEM" : "RECIPIENT"}
                            </span>
                            <span className="leading-relaxed">{cleanLine}</span>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  demo.transcript.length === 0 ? (
                    <p className="text-sm leading-relaxed text-slate-500">
                      When the agent speaks, you&apos;ll see the transcript here. Answer in your
                      chosen language — the agent follows the scenario you picked.
                    </p>
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-800">
                      {demo.transcript.join("\n")}
                    </pre>
                  )
                )}
              </div>
            </ScrollArea>
          </section>

          {dialMode === "browser" && (
            <ul className="flex shrink-0 flex-wrap gap-2">
              {demo.preflight.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600"
                  title={item.detail}
                >
                  <PreflightDot state={item.state} />
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer controls */}
        <footer className="shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 py-3 md:px-5">
          <div className="flex flex-wrap items-center gap-2">
            {dialMode === "phone" ? (
              <>
                <Button
                  type="button"
                  onClick={() => void phoneCall.start()}
                  disabled={locked}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  <PhoneCall className="size-4" />
                  Place Call
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void phoneCall.stop()}
                  disabled={phoneCall.status === "idle"}
                  className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Square className="size-4" />
                  Hangup
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copyText(phoneCall.transcript)}
                  disabled={phoneCall.transcript.length === 0}
                  className="gap-2"
                >
                  <Copy className="size-4" />
                  Copy Transcript
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => void demo.start()}
                  disabled={!demo.canStart || demo.isLive || demo.sessionState === "connecting"}
                  className="gap-2"
                >
                  <Play className="size-4" />
                  {startLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void demo.stop()}
                  disabled={demo.sessionState === "idle" && !demo.isLive}
                  className="gap-2"
                >
                  <Square className="size-4" />
                  Stop
                </Button>

                {demo.inputMode === "ptt" && demo.isLive ? (
                  <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                    <Mic
                      className={cn(
                        "size-4 shrink-0",
                        demo.micListening ? "text-emerald-600" : "text-slate-400",
                      )}
                    />
                    <span className="hidden sm:inline">Mic</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={demo.micListening}
                      aria-label={demo.micListening ? "Stop listening" : "Start listening"}
                      onClick={() => void demo.toggleMic()}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors",
                        demo.micListening
                          ? "border-emerald-600 bg-emerald-500"
                          : "border-slate-300 bg-slate-200",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none absolute top-0.5 left-0.5 block size-5 rounded-full bg-white shadow transition-transform",
                          demo.micListening ? "translate-x-5" : "translate-x-0",
                        )}
                      />
                    </button>
                    <span
                      className={cn(
                        "min-w-[4.5rem] text-xs font-medium",
                        demo.micListening ? "text-emerald-700" : "text-slate-500",
                      )}
                    >
                      {demo.pttLabel}
                    </span>
                  </label>
                ) : demo.inputMode === "continuous" && demo.isLive ? (
                  <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <Mic className="size-4 animate-pulse" />
                    {demo.pttLabel}
                  </span>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void demo.copyTranscript()}
                  disabled={demo.transcript.length === 0}
                  className="gap-2"
                >
                  <Copy className="size-4" />
                  Copy
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void demo.recheck()}
                  disabled={demo.isLive || demo.sessionState === "connecting"}
                  className="gap-2"
                >
                  <RefreshCw className="size-4" />
                  Recheck
                </Button>
              </>
            )}
          </div>
        </footer>
      </div>

      <audio ref={demo.audioRef} autoPlay playsInline className="hidden" />
    </div>
  );
}
