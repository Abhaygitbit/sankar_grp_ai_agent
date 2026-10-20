import React from "react";
import {
  CheckCircle2,
  X,
  Play,
  Pause,
  Download,
  Share2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
  Volume2,
} from "lucide-react";
import { CallRecord } from "../types/call";
import { SalesStatusBadge } from "./StatusBadge";

interface CallAnalysisModalProps {
  call: CallRecord | null;
  audioBlobUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToHistory: () => void;
  onStartNewCall: () => void;
}

export function CallAnalysisModal({
  call,
  audioBlobUrl,
  isOpen,
  onClose,
  onGoToHistory,
  onStartNewCall,
}: CallAnalysisModalProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  if (!isOpen || !call) return null;

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const minutes = Math.floor(call.duration_seconds / 60);
  const seconds = call.duration_seconds % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">
                  Call Completed & Analyzed
                </h2>
                <SalesStatusBadge status={call.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI Sales Intelligence report for BillEasy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {timeFormatted}
            </span>
            <span>•</span>
            <span className="uppercase font-semibold tracking-wider text-slate-300">
              {call.language}
            </span>
            {call.synced_to_supabase && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Database className="w-3 h-3" /> Supabase Synced
                </span>
              </>
            )}
          </div>
        </div>

        {/* Audio Player Card (Mixed Call Recording) */}
        {audioBlobUrl && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-800/60 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleTogglePlay}
                className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95 shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-400" /> Mixed Call Recording
                </p>
                <p className="text-xs text-slate-400">
                  Customer microphone + Bot audio stream
                </p>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={audioBlobUrl}
              onEnded={() => setIsPlaying(false)}
              className="w-full sm:w-64 h-8"
              controls
            />

            <a
              href={audioBlobUrl}
              download={`BillEasy-Call-${call.id}.webm`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        )}

        {/* AI Analysis Cards */}
        <div className="space-y-4 mb-6">
          {/* Summary */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1.5">
              Executive Call Summary
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed">
              {call.summary || "No conversation detected."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Requirements */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                Customer Requirements & Pain Points
              </h4>
              {call.requirements && call.requirements.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {call.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No specific requirements identified.
                </p>
              )}
            </div>

            {/* Objections */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                Objections & Concerns
              </h4>
              {call.objections && call.objections.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {call.objections.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No objections voiced during call.
                </p>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-900/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
              Recommended Next Steps
            </h4>
            {call.next_steps && call.next_steps.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-indigo-100">
                {call.next_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-indigo-300/60 italic">
                Follow up as needed.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onGoToHistory}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <span>View All History</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onStartNewCall}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95"
          >
            Start Another Call
          </button>
        </div>
      </div>
    </div>
  );
}
