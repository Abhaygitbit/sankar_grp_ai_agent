export type CallState =
  | "Idle"
  | "Connecting"
  | "Listening"
  | "Bot Speaking"
  | "Ended";

export type SalesStatus =
  | "Converted"
  | "Interested"
  | "Follow-up Required"
  | "Not Interested"
  | "Demo Requested"
  | "No Response";

export interface TranscriptItem {
  id: string;
  speaker: "bot" | "customer";
  text: string;
  timestamp: number;
  isInterim?: boolean;
}

export interface CallAnalysis {
  summary: string;
  customer_requirements: string[];
  objections: string[];
  next_steps: string[];
  status: SalesStatus;
}

export interface CallRecord {
  id: string;
  started_at: string;
  duration_seconds: number;
  language: string;
  transcript: TranscriptItem[];
  recording_url?: string;
  summary: string;
  requirements: string[];
  objections: string[];
  next_steps: string[];
  status: SalesStatus;
  synced_to_supabase?: boolean;
}

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  welcomeGreeting: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: "en-IN",
    label: "English (India)",
    nativeLabel: "English (India)",
    welcomeGreeting:
      "Hi, this is Riya from BillEasy! Do you have a quick minute to chat about your business billing?",
  },
  {
    code: "hi-IN",
    label: "Hinglish / Hindi (हिंदी)",
    nativeLabel: "हिंदी / Hinglish",
    welcomeGreeting:
      "Namaste! Main BillEasy se Riya bol rahi hoon. Kya aapke paas ek minute hoga?",
  },
  {
    code: "te-IN",
    label: "Telugu (తెలుగు)",
    nativeLabel: "తెలుగు",
    welcomeGreeting:
      "నమస్కారం! నేను BillEasy నుండి రియా మాట్లాడుతున్నాను. మీ వ్యాపార బిల్లింగ్ గురించి మాట్లాడటానికి మీకు ఒక నిమిషం సమయం ఉందా?",
  },
  {
    code: "en-US",
    label: "English (US)",
    nativeLabel: "English (US)",
    welcomeGreeting:
      "Hi, I'm Riya from BillEasy! Do you have a quick minute to chat about your business invoicing?",
  },
];
