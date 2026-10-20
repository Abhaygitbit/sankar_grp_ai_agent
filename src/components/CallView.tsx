import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Languages,
  Sparkles,
  Send,
  AlertCircle,
  Bot,
  User,
  Zap,
} from "lucide-react";
import {
  CallState,
  TranscriptItem,
  CallRecord,
  SUPPORTED_LANGUAGES,
} from "../types/call";
import { CallStatusBadge } from "./StatusBadge";
import { AudioVisualizer } from "./AudioVisualizer";
import { ConsentModal } from "./ConsentModal";
import { CallAnalysisModal } from "./CallAnalysisModal";
import { createCallAudioMixer, MixerControls } from "../services/audioMixer";
import { SpeechService } from "../services/speechService";
import {
  sendChatMessage,
  fetchBotTTS,
  analyzeTranscriptWithGemini,
} from "../services/geminiClient";
import { saveCallRecord } from "../services/storageService";

interface CallViewProps {
  onCallSaved?: (record: CallRecord) => void;
  onGoToHistory: () => void;
}

export function CallView({ onCallSaved, onGoToHistory }: CallViewProps) {
  // Call States
  const [callState, setCallState] = useState<CallState>("Idle");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-IN");
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);

  // Transcript
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [interimText, setInterimText] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");

  // Post Call Analysis Modal
  const [completedCall, setCompletedCall] = useState<CallRecord | null>(null);
  const [completedAudioUrl, setCompletedAudioUrl] = useState<string | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Notice notification
  const [notice, setNotice] = useState<{ message: string; type: "info" | "warn" } | null>(null);

  // Refs for audio mixer, speech recognition, and timers
  const mixerRef = useRef<MixerControls | null>(null);
  const speechRef = useRef<SpeechService | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const callStartTimeRef = useRef<number>(0);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const isBotSpeakingRef = useRef<boolean>(false);
  const hasSpokenRef = useRef<boolean>(false);
  const lastBotSpokenTextRef = useRef<string>("");

  // Auto-scroll chat panel to bottom
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcript, interimText]);

  // Call timer interval
  useEffect(() => {
    if (callState !== "Idle" && callState !== "Ended") {
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callState]);

  // Silence timer handler (10s of silence -> prompt user)
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (callState === "Listening" || callState === "Idle") {
      silenceTimerRef.current = setTimeout(() => {
        handleSilencePrompt();
      }, 10000);
    }
  }, [callState, selectedLanguage]);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const handleSilencePrompt = async () => {
    if (isBotSpeakingRef.current || callState !== "Listening") return;

    let silenceText =
      "Are you still there? Let me know if you have any questions about BillEasy or GST billing.";
    if (selectedLanguage.startsWith("hi")) {
      silenceText =
        "Kya aap sun pa rahe hain? Agar BillEasy ya GST billing ko lekar koi sawaal hai toh batayein.";
    } else if (selectedLanguage.startsWith("te")) {
      silenceText =
        "మీరు వింటున్నారా? BillEasy GST బిల్లింగ్ గురించి ఏవైనా ప్రశ్నలు ఉంటే దయచేసి అడగండి.";
    }

    await triggerBotSpeech(silenceText);
  };

  // Immediate interruption of bot voice
  const handleInterrupt = useCallback(() => {
    if (isBotSpeakingRef.current) {
      if (mixerRef.current) {
        mixerRef.current.stopBotAudio();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      isBotSpeakingRef.current = false;
      setCallState("Listening");
      resetSilenceTimer();
      setNotice({
        message: "Bot interrupted. Listening to your response...",
        type: "info",
      });
      setTimeout(() => setNotice(null), 2500);
    }
  }, [resetSilenceTimer]);

  // Bot Speech Output & Web Audio mixer integration
  const triggerBotSpeech = async (botText: string) => {
    isBotSpeakingRef.current = true;
    lastBotSpokenTextRef.current = botText.toLowerCase();
    setCallState("Bot Speaking");
    clearSilenceTimer();

    // Add bot message to transcript
    const botMsgId = "msg-" + Date.now();
    setTranscript((prev) => [
      ...prev,
      {
        id: botMsgId,
        speaker: "bot",
        text: botText,
        timestamp: Math.round((Date.now() - callStartTimeRef.current) / 1000),
      },
    ]);

    try {
      // 1. Request Gemini TTS audio from server
      const ttsResult = await fetchBotTTS(botText, "Kore");

      // Check if user interrupted while TTS was generating
      if (!isBotSpeakingRef.current) {
        return;
      }

      if (ttsResult.available && ttsResult.audioBase64 && mixerRef.current) {
        // 2. Play through audio mixer into both speaker and recording stream
        await mixerRef.current.playBotAudio(ttsResult.audioBase64, () => {
          onBotFinishedSpeaking();
        });
      } else {
        fallbackBotSpeaking(botText);
      }
    } catch (err) {
      console.warn("TTS playback error, triggering fallback:", err);
      fallbackBotSpeaking(botText);
    }
  };

  // Fallback if Gemini TTS returns unavailable
  const fallbackBotSpeaking = (text: string) => {
    if (!isBotSpeakingRef.current) return;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage;
      utterance.rate = 1.05;
      utterance.onend = () => onBotFinishedSpeaking();
      utterance.onerror = () => onBotFinishedSpeaking();
      window.speechSynthesis.speak(utterance);
    } else {
      const words = text.split(" ").length;
      setTimeout(() => {
        onBotFinishedSpeaking();
      }, Math.max(1600, words * 260));
    }
  };

  // Callback when bot finishes speaking
  const onBotFinishedSpeaking = () => {
    isBotSpeakingRef.current = false;
    setCallState("Listening");

    // Make sure speech service is actively listening
    if (speechRef.current) {
      speechRef.current.resume();
    }

    resetSilenceTimer();
  };

  // Process customer speech input
  const handleCustomerMessage = async (customerText: string) => {
    const trimmed = customerText.trim();
    if (!trimmed) return;

    // Filter out accidental acoustic self-echo from bot speakers
    const lastBot = lastBotSpokenTextRef.current;
    if (lastBot && lastBot.includes(trimmed.toLowerCase()) && trimmed.length < 15) {
      return;
    }

    hasSpokenRef.current = true;
    clearSilenceTimer();

    // If bot was still speaking, cut off immediately
    if (isBotSpeakingRef.current) {
      handleInterrupt();
    }

    setInterimText("");

    // Add customer message to transcript
    const userMsgId = "msg-" + Date.now();
    const updatedTranscript: TranscriptItem[] = [
      ...transcript,
      {
        id: userMsgId,
        speaker: "customer",
        text: trimmed,
        timestamp: Math.round((Date.now() - callStartTimeRef.current) / 1000),
      },
    ];

    setTranscript(updatedTranscript);

    // Build chat history for Gemini API
    const historyPayload = updatedTranscript.map((t) => ({
      role: (t.speaker === "customer" ? "user" : "model") as "user" | "model",
      content: t.text,
    }));

    try {
      const reply = await sendChatMessage(historyPayload, selectedLanguage);
      await triggerBotSpeech(reply);
    } catch (err) {
      console.error("Failed to generate bot reply:", err);
      await triggerBotSpeech(
        selectedLanguage.startsWith("hi")
          ? "BillEasy se aap sirf 30 seconds mein GST bills bana sakte hain. Kya aap 14-din ka free trial lena chahenge?"
          : "BillEasy helps you generate GST bills in 30 seconds and recovers late payments with WhatsApp reminders. Would you like to start a 14-day free trial?"
      );
    }
  };

  const handleStartCallClick = () => {
    setShowConsentModal(true);
  };

  const handleConsentAccepted = async () => {
    setShowConsentModal(false);
    setCallState("Connecting");
    setTranscript([]);
    setCallDuration(0);
    hasSpokenRef.current = false;
    callStartTimeRef.current = Date.now();

    try {
      // 1. Request microphone permission
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 2. Initialize Web Audio API mixer
      const mixer = await createCallAudioMixer(micStream);
      mixerRef.current = mixer;

      // 3. Initialize ultra-resilient Web Speech recognition
      const speech = new SpeechService(
        {
          onInterim: (text) => {
            // Instant interruption: If customer speaks while bot is speaking, interrupt immediately
            if (isBotSpeakingRef.current && text.trim().length > 1) {
              handleInterrupt();
            }
            setInterimText(text);
          },
          onFinal: (text) => {
            handleCustomerMessage(text);
          },
          onError: (err) => {
            console.warn("Speech recognition warning:", err);
          },
        },
        selectedLanguage
      );

      speechRef.current = speech;
      speech.start();

      // 4. Initial greeting from Riya
      const currentLang =
        SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) ||
        SUPPORTED_LANGUAGES[0];

      setTimeout(() => {
        triggerBotSpeech(currentLang.welcomeGreeting);
      }, 500);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setCallState("Idle");
      setNotice({
        message:
          "Microphone access was denied or is unavailable. Please allow microphone permissions in your browser.",
        type: "warn",
      });
    }
  };

  const handleEndCall = async () => {
    if (callState === "Idle" || callState === "Ended") return;

    setCallState("Ended");
    clearSilenceTimer();
    setIsAnalyzing(true);

    if (speechRef.current) {
      speechRef.current.stop();
      speechRef.current = null;
    }

    if (mixerRef.current) {
      mixerRef.current.stopBotAudio();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    let audioBlob: Blob | undefined;
    let localBlobUrl: string | null = null;

    if (mixerRef.current) {
      try {
        audioBlob = await mixerRef.current.stopRecording();
        if (audioBlob && audioBlob.size > 0) {
          localBlobUrl = URL.createObjectURL(audioBlob);
          setCompletedAudioUrl(localBlobUrl);
        }
      } catch (e) {
        console.warn("Error finalizing audio recording:", e);
      }
      mixerRef.current = null;
    }

    const finalTranscript = [...transcript];
    const duration = callDuration;
    const callId = "call-" + Date.now();

    try {
      const analysis = await analyzeTranscriptWithGemini(
        finalTranscript.map((t) => ({ speaker: t.speaker, text: t.text })),
        duration,
        selectedLanguage
      );

      const record: CallRecord = {
        id: callId,
        started_at: new Date(
          callStartTimeRef.current || Date.now()
        ).toISOString(),
        duration_seconds: duration,
        language: selectedLanguage,
        transcript: finalTranscript,
        recording_url: localBlobUrl || undefined,
        summary: analysis.summary,
        requirements: analysis.customer_requirements,
        objections: analysis.objections,
        next_steps: analysis.next_steps,
        status: hasSpokenRef.current ? analysis.status : "No Response",
      };

      await saveCallRecord(record, audioBlob);

      setCompletedCall(record);
      setShowAnalysisModal(true);
      if (onCallSaved) {
        onCallSaved(record);
      }
    } catch (analysisErr) {
      console.error("Call post-analysis failed:", analysisErr);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleMute = () => {
    setIsMicMuted((prev) => {
      const next = !prev;
      if (next) {
        speechRef.current?.pause();
      } else {
        speechRef.current?.resume();
      }
      return next;
    });
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || callState === "Idle" || callState === "Ended")
      return;
    const text = textInput.trim();
    setTextInput("");
    handleCustomerMessage(text);
  };

  const minutes = Math.floor(callDuration / 60);
  const seconds = callDuration % 60;
  const formattedTimer = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const currentSpeaker: "bot" | "customer" | "none" =
    callState === "Bot Speaking"
      ? "bot"
      : callState === "Listening" && interimText
      ? "customer"
      : "none";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {notice && (
        <div
          className={`mb-4 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-medium border animate-fadeIn ${
            notice.type === "warn"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {notice.message}
          </span>
          <button
            onClick={() => setNotice(null)}
            className="text-xs underline hover:opacity-80 ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Call Dashboard Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                <Bot className="w-7 h-7" />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  callState === "Listening" || callState === "Bot Speaking"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-slate-500"
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Riya • BillEasy Sales Specialist
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  GST Invoicing
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <CallStatusBadge status={callState} />
                {callState !== "Idle" && (
                  <span className="font-mono text-xs font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                    ⏱ {formattedTimer}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls: Language Selector & Call Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <label htmlFor="language-select" className="sr-only">
                Call Language
              </label>
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  id="language-select"
                  disabled={callState !== "Idle"}
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer disabled:opacity-60"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      className="bg-slate-900 text-slate-200"
                    >
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start or End Call Button */}
            {callState === "Idle" || callState === "Ended" ? (
              <button
                type="button"
                onClick={handleStartCallClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                <Phone className="w-4 h-4 animate-bounce" />
                Start Call
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Instant Interrupt Button */}
                {callState === "Bot Speaking" && (
                  <button
                    type="button"
                    onClick={handleInterrupt}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors animate-pulse"
                    title="Interrupt the bot immediately"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Interrupt Bot
                  </button>
                )}

                {/* Mute Mic Toggle */}
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    isMicMuted
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                  title={isMicMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMicMuted ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>

                {/* End Call Button */}
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={handleEndCall}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-sm font-bold shadow-lg shadow-rose-500/25 transition-all transform active:scale-95 disabled:opacity-50"
                >
                  <PhoneOff className="w-4 h-4" />
                  {isAnalyzing ? "Analyzing..." : "End Call"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Audio Visualizer Stream */}
        <div className="my-4">
          <AudioVisualizer
            analyser={mixerRef.current?.analyser || null}
            isActive={callState === "Listening" || callState === "Bot Speaking"}
            speaker={currentSpeaker}
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mt-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Green: Your Microphone
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
              Purple: Riya Voice (Gemini TTS)
            </span>
            <span className="hidden sm:inline text-slate-400">
              ⚡ Ultra-responsive speech loop with live interruption
            </span>
          </div>
        </div>

        {/* Live Chat & Transcript Screen */}
        <div className="rounded-2xl bg-slate-950/70 border border-slate-800/80 overflow-hidden flex flex-col h-[380px]">
          <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold text-slate-300">
                Live Speech-to-Text Conversation
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {transcript.length} turns recorded
            </span>
          </div>

          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth"
          >
            {transcript.length === 0 && !interimText && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3 border border-slate-700/60">
                  <Mic className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-sm font-semibold text-slate-300">
                  {callState === "Idle"
                    ? "Click 'Start Call' to speak with Riya"
                    : "Connecting live voice session..."}
                </p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Riya will introduce BillEasy, explain GST invoicing, address
                  payment delay challenges, and guide you towards booking a demo
                  or 14-day free trial.
                </p>
              </div>
            )}

            {transcript.map((item) => (
              <div
                key={item.id}
                className={`flex gap-3 max-w-[85%] ${
                  item.speaker === "customer"
                    ? "ml-auto flex-row-reverse"
                    : "mr-auto"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    item.speaker === "customer"
                      ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                      : "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  }`}
                >
                  {item.speaker === "customer" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                <div
                  className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed border shadow-sm ${
                    item.speaker === "customer"
                      ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-100 rounded-tr-none"
                      : "bg-slate-900 border-slate-800 text-slate-100 rounded-tl-none"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold uppercase tracking-wider text-slate-300">
                      {item.speaker === "customer" ? "You (Customer)" : "Riya (BillEasy)"}
                    </span>
                    <span>{item.timestamp}s</span>
                  </div>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}

            {interimText && (
              <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="rounded-2xl rounded-tr-none px-4 py-2.5 text-xs sm:text-sm bg-emerald-950/30 border border-emerald-500/30 text-emerald-200/90 italic shadow-sm">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mb-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span>Transcribing live...</span>
                  </div>
                  <p>{interimText}</p>
                </div>
              </div>
            )}

            {callState === "Bot Speaking" && !transcript.length && (
              <div className="flex gap-3 max-w-[80%] mr-auto animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl rounded-tl-none px-4 py-2.5 text-xs bg-slate-900 border border-slate-800 text-indigo-300 flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  <span>Riya is speaking...</span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSendText}
            className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              disabled={callState === "Idle" || callState === "Ended"}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                callState === "Idle"
                  ? "Start call to speak or type..."
                  : "Speak into your mic, or type message here as backup..."
              }
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={
                !textInput.trim() || callState === "Idle" || callState === "Ended"
              }
              className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl transition-colors disabled:opacity-40"
              title="Send text message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            <span>Continuous speech listening with zero query dropouts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Instant voice interruption & 10s silence detection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>Automated BillEasy CRM post-call sales intelligence</span>
          </div>
        </div>
      </div>

      <ConsentModal
        isOpen={showConsentModal}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        onAccept={handleConsentAccepted}
        onDecline={() => setShowConsentModal(false)}
      />

      <CallAnalysisModal
        call={completedCall}
        audioBlobUrl={completedAudioUrl}
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        onGoToHistory={() => {
          setShowAnalysisModal(false);
          onGoToHistory();
        }}
        onStartNewCall={() => {
          setShowAnalysisModal(false);
          handleStartCallClick();
        }}
      />
    </div>
  );
}
