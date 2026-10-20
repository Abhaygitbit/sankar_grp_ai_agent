import React from "react";
import {
  PhoneCall,
  History,
  Tag,
  Award,
  Bot,
  Settings,
} from "lucide-react";

interface NavbarProps {
  activeTab: "call" | "history";
  onTabChange: (tab: "call" | "history") => void;
  callCount: number;
  onOpenProductInfo: () => void;
  onOpenSupabase: () => void;
  onOpenAssignmentInfo: () => void;
}

export function Navbar({
  activeTab,
  onTabChange,
  callCount,
  onOpenProductInfo,
  onOpenSupabase,
  onOpenAssignmentInfo,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo - CloserAI */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">
                CloserAI
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                BillEasy
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden xs:block">
              AI Voice Sales Agent • GST Billing & Invoicing
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => onTabChange("call")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "call"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Live Call</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("history")}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "history"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
            {callCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === "history"
                    ? "bg-indigo-700 text-white"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {callCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Access Action Modals */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Changed CRM Specs to Pricing tag */}
          <button
            type="button"
            onClick={onOpenProductInfo}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
            title="BillEasy Pricing & Plans"
          >
            <Tag className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-emerald-400">Pricing</span>
          </button>

          {/* Assignment Checklist */}
          <button
            type="button"
            onClick={onOpenAssignmentInfo}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
            title="Assignment Checklist"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Checklist</span>
          </button>

          {/* Discreet Settings (Database & Storage) */}
          <button
            type="button"
            onClick={onOpenSupabase}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            title="Database & Storage Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
