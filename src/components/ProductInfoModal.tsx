import React from "react";
import {
  X,
  Zap,
  CheckCircle2,
  Tag,
  Shield,
  Clock,
  Sparkles,
  Smartphone,
  HelpCircle,
  FileCheck,
} from "lucide-react";

interface ProductInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductInfoModal({ isOpen, onClose }: ProductInfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">
                BillEasy • Pricing & Plans
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                GST Software
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Official pricing, features, and sales pitch reference for Riya (CloserAI)
            </p>
          </div>
        </div>

        {/* Free Offer Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-indigo-950/30 border border-emerald-500/30 mb-6 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-0.5">
              14-Day Risk-Free Trial Offer
            </span>
            <p className="text-xs sm:text-sm text-slate-200">
              No credit or debit card required. Free 15-minute live demo & 10-minute setup assistance.
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold whitespace-nowrap">
            ₹0 to start
          </span>
        </div>

        {/* Pricing Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Starter Plan */}
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Starter Plan
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                  Single Shop
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-3xl font-black text-white">₹299</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 mt-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>GST invoice in 30 seconds on phone/PC</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Automatic WhatsApp payment reminders</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Direct UPI payment links on every bill</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Daily sales & GST reports</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 relative flex flex-col justify-between shadow-lg shadow-indigo-500/10">
            <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm">
              Recommended
            </span>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Pro Plan
                </span>
                <span className="text-[10px] text-indigo-300 bg-indigo-900/60 px-2 py-0.5 rounded-md">
                  Wholesale & Multi-staff
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-3xl font-black text-white">₹799</span>
                <span className="text-xs text-slate-300">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-indigo-100 mt-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Everything in Starter Plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Multiple user accounts for shop staff</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Real-time stock & inventory alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Dedicated priority onboarding manager</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Objection Handling Cheat Sheet */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Riya's Objection Handling Method</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-0.5">
                "Too Expensive"
              </span>
              <span className="text-slate-300">
                A single recovered late payment covers months of the ₹299 fee, and the 14-day trial is 100% free.
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="font-bold text-indigo-400 block mb-0.5">
                "I use Excel or Paper"
              </span>
              <span className="text-slate-300">
                Excel doesn't send WhatsApp reminders with UPI links or auto-generate GST reports.
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="font-bold text-purple-400 block mb-0.5">
                "No Time to Setup"
              </span>
              <span className="text-slate-300">
                Setup takes only 10 minutes on mobile and our team assists with everything for free.
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-0.5">
                "Need to ask Partner"
              </span>
              <span className="text-slate-300">
                Offer the 14-day free trial so both partners can test it live without paying any money.
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            Close Pricing
          </button>
        </div>
      </div>
    </div>
  );
}
