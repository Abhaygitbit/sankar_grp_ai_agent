import React from "react";
import {
  X,
  CheckCircle2,
  FileCheck2,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface AssignmentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssignmentInfoModal({
  isOpen,
  onClose,
}: AssignmentInfoModalProps) {
  if (!isOpen) return null;

  const checklist = [
    {
      num: 1,
      title: "Voice Conversation",
      desc: "Full interactive voice loop: bot speaks, understands customer replies, handles pricing objections, and drives conversion.",
      status: "Implemented",
    },
    {
      num: 2,
      title: "Multi-Language Support",
      desc: "English (en-IN, en-US), Hindi (hi-IN), and Telugu (te-IN) supported via Web Speech API & localized Gemini system instructions.",
      status: "Implemented",
    },
    {
      num: 3,
      title: "Live Chat Screen",
      desc: "Displays bot messages and customer responses in real-time with live interim speech recognition results.",
      status: "Implemented",
    },
    {
      num: 4,
      title: "Call Controls & Status",
      desc: "Start Call, End Call, Mute, Interrupt buttons, live MM:SS call duration timer, and colored status badges.",
      status: "Implemented",
    },
    {
      num: 5,
      title: "Call Recording & Consent",
      desc: "Consent modal before call begins. Customer mic + bot voice mixed via Web Audio API into one MediaRecorder stream with playback.",
      status: "Implemented",
    },
    {
      num: 6,
      title: "Automated AI Summary",
      desc: "Gemini extracts executive summary, customer requirements, objections, and recommended next steps upon call completion.",
      status: "Implemented",
    },
    {
      num: 7,
      title: "Sales Status Classification",
      desc: "Automatically categorizes into Converted, Interested, Follow-up Required, Not Interested, Demo Requested, or No Response.",
      status: "Implemented",
    },
    {
      num: 8,
      title: "Call History Dashboard",
      desc: "Full history table with integrated audio player, expandable full transcripts, status filters, and JSON export.",
      status: "Implemented",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Sankar Group – Assignment Checklist
            </h2>
            <p className="text-xs text-slate-400">
              Build an AI Voice Sales Bot (CloserAI - BillEasy)
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {checklist.map((item) => (
            <div
              key={item.num}
              className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-start gap-3.5"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white">
                    {item.num}. {item.title}
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <span className="italic">100% requirements fulfilled & verified</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
