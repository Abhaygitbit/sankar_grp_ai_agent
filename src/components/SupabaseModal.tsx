import React, { useState, useEffect } from "react";
import {
  Database,
  X,
  CheckCircle2,
  Copy,
  ShieldAlert,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import {
  getSupabaseCredentials,
  setSupabaseCredentials,
  getSupabaseClient,
} from "../services/storageService";

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseModal({ isOpen, onClose }: SupabaseModalProps) {
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setTestResult(null);
      setShowKey(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setSupabaseCredentials(url, anonKey);
    setTestResult({
      success: true,
      message: "Database credentials saved and secured in local storage.",
    });
  };

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        success: false,
        message: "Please provide valid Supabase credentials.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      setSupabaseCredentials(url, anonKey);
      const client = getSupabaseClient();
      if (!client) {
        throw new Error("Could not initialize Supabase client.");
      }

      const { data, error } = await client
        .from("calls")
        .select("id")
        .limit(1);

      if (error) {
        if (error.code === "42P01" || error.message.includes("does not exist")) {
          setTestResult({
            success: true,
            message:
              "Connected! Please execute the SQL schema below to create the 'calls' table.",
          });
        } else {
          setTestResult({
            success: false,
            message: `Supabase error: ${error.message}`,
          });
        }
      } else {
        setTestResult({
          success: true,
          message:
            "Successfully connected to Supabase and verified 'calls' table!",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to connect to Supabase.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const sqlSchema = `create table if not exists public.calls (
  id text primary key,
  started_at timestamptz default now(),
  duration_seconds integer default 0,
  language text,
  transcript jsonb,
  recording_url text,
  summary text,
  requirements text[],
  objections text[],
  next_steps text[],
  status text
);

alter table public.calls enable row level security;
create policy "Allow anonymous call logging" on public.calls
  for all using (true) with check (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Cloud Database Sync</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> Masked & Secure
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Optional remote storage backup (local IndexedDB is enabled by default)
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 leading-relaxed mb-4">
          <span className="font-semibold text-emerald-400">
            Local Storage Active:
          </span>{" "}
          All voice calls and audio recordings are stored privately in your browser's IndexedDB. Enter credentials below only if you wish to mirror recordings to Supabase.
        </div>

        <div className="space-y-3.5 mb-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                API Key (Hidden)
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {showKey ? (
                  <>
                    <EyeOff className="w-3 h-3" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" /> Reveal
                  </>
                )}
              </button>
            </div>
            <input
              type={showKey ? "text" : "password"}
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-medium border flex items-start gap-2 ${
              testResult.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Database SQL Migration
            </span>
            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Copy className="w-3 h-3" />
              {copiedSql ? "Copied SQL!" : "Copy SQL"}
            </button>
          </div>
          <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-32 leading-relaxed">
            {sqlSchema}
          </pre>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {isTesting ? "Testing..." : "Test Connection"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
          >
            Save Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
