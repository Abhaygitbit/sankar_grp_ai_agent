import React from "react";
import { CallState, SalesStatus } from "../types/call";
import {
  Mic,
  Volume2,
  PhoneOff,
  Radio,
  Clock,
  CheckCircle2,
  Sparkles,
  CalendarCheck,
  AlertCircle,
  XCircle,
  UserX,
} from "lucide-react";

export function CallStatusBadge({ status }: { status: CallState }) {
  switch (status) {
    case "Idle":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Idle
        </span>
      );
    case "Connecting":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          Connecting...
        </span>
      );
    case "Listening":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
          Listening to You
        </span>
      );
    case "Bot Speaking":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
          Bot Speaking (Riya)
        </span>
      );
    case "Ended":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <PhoneOff className="w-3.5 h-3.5 text-slate-500" />
          Call Ended
        </span>
      );
    default:
      return null;
  }
}

export function SalesStatusBadge({ status }: { status: SalesStatus }) {
  switch (status) {
    case "Converted":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Converted
        </span>
      );
    case "Demo Requested":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
          Demo Requested
        </span>
      );
    case "Interested":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Interested
        </span>
      );
    case "Follow-up Required":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          Follow-up Required
        </span>
      );
    case "Not Interested":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          Not Interested
        </span>
      );
    case "No Response":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <UserX className="w-3.5 h-3.5 text-slate-500" />
          No Response
        </span>
      );
  }
}
