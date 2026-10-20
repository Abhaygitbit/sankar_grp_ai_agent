/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { CallView } from "./components/CallView";
import { HistoryView } from "./components/HistoryView";
import { ProductInfoModal } from "./components/ProductInfoModal";
import { SupabaseModal } from "./components/SupabaseModal";
import { AssignmentInfoModal } from "./components/AssignmentInfoModal";
import { CallRecord } from "./types/call";
import { getAllCalls } from "./services/storageService";
import { Sparkles, Bot, ShieldCheck, Zap } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"call" | "history">("call");
  const [callCount, setCallCount] = useState<number>(0);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  // Fetch initial call count
  const refreshCallCount = async () => {
    try {
      const calls = await getAllCalls();
      setCallCount(calls.length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshCallCount();
  }, []);

  const handleCallSaved = (newRecord: CallRecord) => {
    refreshCallCount();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] bg-emerald-600/10 blur-3xl rounded-full opacity-40" />
        <div className="absolute bottom-10 -left-40 w-[400px] h-[400px] bg-indigo-600/10 blur-3xl rounded-full opacity-40" />
      </div>

      {/* Main Navigation Bar */}
      <div className="relative z-10">
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          callCount={callCount}
          onOpenProductInfo={() => setIsProductModalOpen(true)}
          onOpenSupabase={() => setIsSupabaseModalOpen(true)}
          onOpenAssignmentInfo={() => setIsAssignmentModalOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col">
        {activeTab === "call" ? (
          <CallView
            onCallSaved={handleCallSaved}
            onGoToHistory={() => setActiveTab("history")}
          />
        ) : (
          <HistoryView onStartNewCall={() => setActiveTab("call")} />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>CloserAI • BillEasy Sales Specialist (Riya)</span>
          </p>
          <p className="text-slate-400">
            Powered by Gemini 3.8 Flash & Gemini 3.8 TTS • Web Audio API Recording
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ProductInfoModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
      />
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
      <AssignmentInfoModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
      />
    </div>
  );
}
