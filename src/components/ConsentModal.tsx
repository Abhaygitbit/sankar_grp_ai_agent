import React from "react";
import { Mic, ShieldCheck, X, AlertTriangle } from "lucide-react";
import { SUPPORTED_LANGUAGES, LanguageOption } from "../types/call";

interface ConsentModalProps {
  isOpen: boolean;
  selectedLanguage: string;
  onSelectLanguage: (code: string) => void;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({
  isOpen,
  selectedLanguage,
  onSelectLanguage,
  onAccept,
  onDecline,
}: ConsentModalProps) {
  if (!isOpen) return null;

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-indigo-500/10 text-slate-100">
        <button
          onClick={onDecline}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Call Recording Consent
            </h3>
            <p className="text-xs text-slate-400">
              Mandatory compliance verification
            </p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-slate-200 mb-1">
            "This call will be recorded. Do you consent?"
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            By clicking <span className="text-indigo-300 font-medium">"I Consent & Start Call"</span>,
            you allow BillEasy to record your microphone audio mixed with
            the AI voice agent for conversational intelligence, CRM pipeline
            analysis, and transcript generation.
          </p>
        </div>

        {/* Language Selection before starting */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Conversation Language
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => onSelectLanguage(lang.code)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                  selectedLanguage === lang.code
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500"
                    : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                <span>{lang.label}</span>
                {selectedLanguage === lang.code && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95"
          >
            <Mic className="w-4 h-4" />
            I Consent & Start
          </button>
        </div>
      </div>
    </div>
  );
}
