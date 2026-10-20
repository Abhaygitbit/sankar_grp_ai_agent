import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Download,
  Search,
  Filter,
  FileText,
  Volume2,
  Trash2,
  Share2,
  Database,
  RefreshCw,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { CallRecord, SalesStatus } from "../types/call";
import { SalesStatusBadge } from "./StatusBadge";
import {
  getAllCalls,
  getCallAudioBlob,
  deleteCallRecord,
} from "../services/storageService";

interface HistoryViewProps {
  onStartNewCall: () => void;
}

export function HistoryView({ onStartNewCall }: HistoryViewProps) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  // Audio Playback state
  const [activeAudioCallId, setActiveAudioCallId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const activeAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const records = await getAllCalls();
      setCalls(records);
    } catch (err) {
      console.error("Failed to load calls:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, []);

  // Pre-load audio URL for a call (from IndexedDB Blob or remote URL)
  const getOrLoadAudioUrl = async (call: CallRecord): Promise<string | null> => {
    if (audioUrls[call.id]) {
      return audioUrls[call.id];
    }
    if (call.recording_url) {
      return call.recording_url;
    }

    const blob = await getCallAudioBlob(call.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      setAudioUrls((prev) => ({ ...prev, [call.id]: url }));
      return url;
    }
    return null;
  };

  const handleTogglePlay = async (call: CallRecord) => {
    if (activeAudioCallId === call.id) {
      if (activeAudioRef.current) {
        if (isPlaying) {
          activeAudioRef.current.pause();
          setIsPlaying(false);
        } else {
          activeAudioRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
      }
      return;
    }

    // New audio track
    const url = await getOrLoadAudioUrl(call);
    if (url) {
      setActiveAudioCallId(call.id);
      setIsPlaying(true);
      if (activeAudioRef.current) {
        activeAudioRef.current.src = url;
        activeAudioRef.current.play().catch(console.error);
      }
    }
  };

  const handleDeleteCall = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this call record?")) {
      await deleteCallRecord(id);
      setCalls((prev) => prev.filter((c) => c.id !== id));
      if (expandedCallId === id) setExpandedCallId(null);
      if (activeAudioCallId === id) {
        if (activeAudioRef.current) activeAudioRef.current.pause();
        setActiveAudioCallId(null);
        setIsPlaying(false);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCallId((prev) => (prev === id ? null : id));
  };

  // Filtered calls
  const filteredCalls = calls.filter((call) => {
    const matchesStatus =
      statusFilter === "All" || call.status === statusFilter;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesSummary = (call.summary || "").toLowerCase().includes(query);
    const matchesReqs = (call.requirements || []).some((r) =>
      r.toLowerCase().includes(query)
    );
    const matchesObjs = (call.objections || []).some((o) =>
      o.toLowerCase().includes(query)
    );
    const matchesTranscript = (call.transcript || []).some((t) =>
      t.text.toLowerCase().includes(query)
    );

    return matchesStatus && (matchesSummary || matchesReqs || matchesObjs || matchesTranscript);
  });

  // Export calls to JSON
  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(calls, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CloserAI-BillEasy-Calls-Export-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* Hidden master audio element */}
      <audio
        ref={activeAudioRef}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Call History & Sales Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse previous voice conversations, listen to full call recordings,
            and review AI CRM summaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadCalls}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            type="button"
            onClick={onStartNewCall}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all transform active:scale-95"
          >
            + Start Call
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer need, objection, or transcript keyword..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            "All",
            "Converted",
            "Interested",
            "Demo Requested",
            "Follow-up Required",
            "Not Interested",
            "No Response",
          ].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                statusFilter === st
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                  : "bg-slate-800/70 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Calls Table & Cards */}
      {loading ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-300">Loading call history...</p>
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No calls found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || statusFilter !== "All"
              ? "No calls match your active filter criteria. Try resetting your search or filters."
              : "No recorded conversations yet. Start your first voice sales call!"}
          </p>
          <button
            onClick={onStartNewCall}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
          >
            Start a Call Now
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredCalls.map((call) => {
            const isExpanded = expandedCallId === call.id;
            const isThisPlaying = activeAudioCallId === call.id && isPlaying;

            return (
              <div
                key={call.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all"
              >
                {/* Main Row */}
                <div
                  onClick={() => toggleExpand(call.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  {/* Left: Play button, Date & Status */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Play/Pause Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePlay(call);
                      }}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-md ${
                        isThisPlaying
                          ? "bg-indigo-600 text-white ring-2 ring-indigo-400"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      }`}
                      title={isThisPlaying ? "Pause recording" : "Play call recording"}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5 text-indigo-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white">
                          {formatDate(call.started_at)}
                        </span>
                        <SalesStatusBadge status={call.status} />
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                          {formatDuration(call.duration_seconds)}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {call.language}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                        {call.summary || "Conversation recorded."}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions and expand toggle */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCall(call.id, e)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Expand / Collapse Indicator */}
                      <div className="flex items-center gap-1 text-xs text-indigo-400 font-semibold px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <span>{isExpanded ? "Hide Details" : "View Transcript"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details: AI Intelligence & Transcript */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-800/80 bg-slate-950/60 animate-fadeIn space-y-5">
                    {/* Audio Player Controls */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Volume2 className="w-4 h-4 text-indigo-400" />
                        <span className="font-semibold">Call Recording Audio</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">
                          Mixed customer mic & bot response stream
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {audioUrls[call.id] && (
                          <a
                            href={audioUrls[call.id]}
                            download={`BillEasy-Call-${call.id}.webm`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download Audio
                          </a>
                        )}
                      </div>
                    </div>

                    {/* AI Analysis Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Customer Requirements */}
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                          Customer Requirements
                        </h4>
                        {call.requirements && call.requirements.length > 0 ? (
                          <ul className="space-y-1 text-xs text-slate-300">
                            {call.requirements.map((r, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500 italic">None noted</p>
                        )}
                      </div>

                      {/* Objections */}
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                          Objections Raised
                        </h4>
                        {call.objections && call.objections.length > 0 ? (
                          <ul className="space-y-1 text-xs text-slate-300">
                            {call.objections.map((o, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-rose-400 font-bold">•</span>
                                <span>{o}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No objections</p>
                        )}
                      </div>

                      {/* Next Steps */}
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                          Recommended Next Steps
                        </h4>
                        {call.next_steps && call.next_steps.length > 0 ? (
                          <ul className="space-y-1 text-xs text-slate-300">
                            {call.next_steps.map((s, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Follow up as needed</p>
                        )}
                      </div>
                    </div>

                    {/* Full Transcript */}
                    <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-800/40 border-b border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>Full Call Transcript</span>
                        <span className="text-[11px] text-slate-400">
                          {call.transcript?.length || 0} dialogue turns
                        </span>
                      </div>
                      <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                        {call.transcript && call.transcript.length > 0 ? (
                          call.transcript.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className={`flex gap-3 text-xs leading-relaxed ${
                                item.speaker === "customer"
                                  ? "text-emerald-200"
                                  : "text-slate-200"
                              }`}
                            >
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                  item.speaker === "customer"
                                    ? "bg-emerald-600/30 text-emerald-300"
                                    : "bg-indigo-600/30 text-indigo-300"
                                }`}
                              >
                                {item.speaker === "customer" ? (
                                  <User className="w-3.5 h-3.5" />
                                ) : (
                                  <Bot className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                                    {item.speaker === "customer"
                                      ? "Customer"
                                      : "Riya (AI Sales)"}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {item.timestamp}s
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm">{item.text}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">
                            No transcript turns recorded for this session.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
