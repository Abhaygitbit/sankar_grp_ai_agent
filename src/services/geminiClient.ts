import { CallAnalysis } from "../types/call";

export async function sendChatMessage(
  history: Array<{ role: "user" | "model"; content: string }>,
  language: string = "en-IN"
): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, language }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return (
      data.reply ||
      "TaskFlow CRM helps streamline sales pipelines and automate outreach. Can I share a quick 2-minute overview?"
    );
  } catch (error) {
    console.error("sendChatMessage error:", error);
    return "TaskFlow CRM helps sales teams close deals faster. Would you like to check out our 14-day free trial?";
  }
}

export async function fetchBotTTS(
  text: string,
  voice: string = "Kore"
): Promise<{ available: boolean; audioBase64?: string; mimeType?: string }> {
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });

    if (!res.ok) {
      return { available: false };
    }

    const data = await res.json();
    if (data.available && data.audioBase64) {
      return {
        available: true,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || "audio/wav",
      };
    }
    return { available: false };
  } catch (err) {
    console.error("fetchBotTTS error:", err);
    return { available: false };
  }
}

export async function analyzeTranscriptWithGemini(
  transcript: Array<{ speaker: string; text: string; timestamp?: number }>,
  durationSeconds: number,
  language: string
): Promise<CallAnalysis> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        duration_seconds: durationSeconds,
        language,
      }),
    });

    if (!res.ok) {
      throw new Error(`Analysis server status: ${res.status}`);
    }

    const data = await res.json();
    return data as CallAnalysis;
  } catch (err) {
    console.error("analyzeTranscript error:", err);
    return {
      summary: "Call concluded with the prospective customer regarding TaskFlow CRM.",
      customer_requirements: ["Sales automation and CRM features"],
      objections: [],
      next_steps: ["Follow up with email documentation and trial invite."],
      status: transcript.length > 2 ? "Interested" : "No Response",
    };
  }
}
