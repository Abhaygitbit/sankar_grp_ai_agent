import { IncomingMessage, ServerResponse } from "http";
import {
  generateSalesReply,
  generateVoiceTTS,
  analyzeCallTranscript,
} from "./gemini.js";

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

async function readJsonBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) {
    return (req as any).body;
  }
  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }
    return body ? JSON.parse(body) : {};
  } catch (err) {
    return {};
  }
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || "";
  // Normalize path removing query strings
  const pathname = url.split("?")[0];

  // /api/health
  if (pathname === "/api/health" || pathname === "/health") {
    sendJson(res, 200, {
      status: "ok",
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
    return true;
  }

  // /api/chat
  if (
    (pathname === "/api/chat" || pathname === "/chat") &&
    req.method === "POST"
  ) {
    try {
      const body = await readJsonBody(req);
      const { history, language } = body;

      const reply = await generateSalesReply(
        Array.isArray(history) ? history : [],
        language || "en-IN"
      );
      sendJson(res, 200, { reply });
    } catch (err: any) {
      console.error("API /chat error:", err);
      sendJson(res, 500, {
        error: "Failed to generate reply",
        fallback:
          "TaskFlow CRM automates your sales outreach and deal tracking. Would you like to schedule a 10-minute demo?",
      });
    }
    return true;
  }

  // /api/tts
  if (
    (pathname === "/api/tts" || pathname === "/tts") &&
    req.method === "POST"
  ) {
    try {
      const body = await readJsonBody(req);
      const { text, voice } = body;
      if (!text || typeof text !== "string") {
        sendJson(res, 400, { error: "Text string is required" });
        return true;
      }

      const audioData = await generateVoiceTTS(text, voice || "Kore");
      if (!audioData) {
        sendJson(res, 200, {
          available: false,
          message: "TTS unavailable, fallback to browser synthesis",
        });
        return true;
      }

      sendJson(res, 200, {
        available: true,
        audioBase64: audioData.audioBase64,
        mimeType: audioData.mimeType,
      });
    } catch (err: any) {
      console.error("API /tts error:", err);
      sendJson(res, 200, {
        available: false,
        error: err?.message || "TTS generation failed",
      });
    }
    return true;
  }

  // /api/analyze
  if (
    (pathname === "/api/analyze" || pathname === "/analyze") &&
    req.method === "POST"
  ) {
    try {
      const body = await readJsonBody(req);
      const { transcript, duration_seconds, language } = body;

      const analysis = await analyzeCallTranscript(
        Array.isArray(transcript) ? transcript : [],
        Number(duration_seconds) || 0,
        language || "en-IN"
      );

      sendJson(res, 200, analysis);
    } catch (err: any) {
      console.error("API /analyze error:", err);
      sendJson(res, 500, {
        error: "Analysis failed",
        fallback: {
          summary: "Call concluded with prospective customer.",
          customer_requirements: [],
          objections: [],
          next_steps: ["Follow up with product documentation."],
          status: "Interested",
        },
      });
    }
    return true;
  }

  return false;
}
