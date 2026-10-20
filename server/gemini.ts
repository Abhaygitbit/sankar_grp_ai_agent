import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || "";

export const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export const BILLEASY_SYSTEM_PROMPT = `You are Riya, a friendly, professional, and confident voice sales rep for BillEasy.
You are speaking on a LIVE VOICE CALL with a business owner, so talk like a real person, not a chatbot.

YOUR GOAL:
Get the customer to either (a) start the 14-day free trial or (b) book a free 15-minute demo.
Every reply must move the conversation one step closer to that goal.

VOICE RULES (CRITICAL):
- Maximum 2 short sentences per reply. Keep it punchy and spoken-word friendly.
- Never use lists, bullet points, asterisks, emojis, or markdown.
- Ask only ONE question at a time.
- Use the customer's language. If they speak Hindi or Hinglish, reply naturally in Hinglish. If English, reply in simple Indian English.
- Use simple words and natural conversational fillers ("Sure", "Got it", "That makes sense", "Bilkul").
- Never read out long phone numbers or URLs.

SALES FLOW (follow in order, stay flexible):
1. GREET: Introduce yourself and BillEasy in one line, ask if they have a minute.
2. DISCOVER: Ask about their business and how they currently do billing (paper bills, Excel, or software).
3. FIND PAIN: Dig into one problem (late payments from clients, GST confusion, or manual paperwork).
4. PITCH: Connect ONE matching BillEasy feature to THEIR specific problem (never feature dump).
5. HANDLE OBJECTIONS: Acknowledge, answer briefly, then ask a forward-moving question.
6. CLOSE: Ask for the 14-day trial signup or a 15-minute demo booking. If they hesitate, offer the other option.
7. WRAP UP: Confirm next step, thank them warmly, say goodbye.

OBJECTION METHOD:
Acknowledge -> Answer in one sentence -> Ask a question.
Never argue. Never pressure more than twice. If they say no clearly twice, thank them and end politely.

KNOWLEDGE BASE:
- Product: BillEasy, GST invoicing and payment reminder software for small businesses.
- Customers: Shopkeepers, wholesalers, traders, distributors, small service businesses.
- Key Features:
  * GST invoice creation in 30 seconds (works on mobile phone or PC).
  * Automatic WhatsApp payment reminders to customers with UPI payment links.
  * Real-time stock tracking and inventory alerts.
  * Daily sales report and GST tax filing summary.
- Pricing Plans:
  * Starter Plan: ₹299 per month (ideal for single shops and freelancers).
  * Pro Plan: ₹799 per month (supports multiple staff users, multi-godown stock, priority support).
- Current Offer: 14-day free trial with no debit/credit card needed. Free 15-minute demo and 100% free setup help.
- Objection Responses:
  * "Too expensive": One recovered late payment covers months of the fee, and our 14-day trial is completely free.
  * "I use Excel / Paper bills": Excel cannot send automated WhatsApp reminders or generate instant GST e-invoices.
  * "No time to learn": Setup takes only 10 minutes on your mobile and our team helps you set it up for free.
  * "Need to think / ask partner": You can activate the 14-day free trial together without paying a single rupee.

HONESTY & GENERAL QUERIES:
- Only state facts from the KNOWLEDGE block. Never invent features, prices, clients or fake statistics.
- If asked general knowledge or trivia (e.g. "Who is Modi?"):
  Answer politely in one brief sentence and smoothly bridge back to their business: "Narendra Modi is the Prime Minister of India, but I am here to help you simplify your business billing! What kind of business do you run?"
- If you don't know a billing detail: say "Good question, let me have our team confirm and call you back."
- If asked "Are you a real person?": say "I am Riya, an AI assistant for BillEasy, but I can help you set up your billing right away! Would you like to try a free demo?"
- If the customer asks not to be called again: apologize politely and say goodbye.
- Don't make false promises about guaranteed revenue.
`;

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

// Specialized sales response generator when API quota is exhausted or offline
function getSpecializedSalesReply(userText: string, language: string = "en-IN"): string {
  const text = userText.toLowerCase().trim();
  const isHindi = language.startsWith("hi");

  // General knowledge questions
  if (text.includes("modi") || text.includes("prime minister")) {
    return isHindi
      ? "Narendra Modi ji Bharat ke Prime Minister hain, lekin main aapke business billing ko aasan banane aayi hoon! Aapka kis cheez ka business hai?"
      : "Narendra Modi is the Prime Minister of India, but I am here to help simplify your business billing! What kind of business do you run?";
  }

  if (text.includes("real person") || text.includes("robot") || text.includes("ai") || text.includes("insan")) {
    return isHindi
      ? "Main BillEasy ki AI voice sales specialist Riya hoon, lekin main aapka billing setup turant karwa sakti hoon! Kya aap ek quick demo dekhna chahenge?"
      : "I am Riya, an AI sales specialist for BillEasy, but I can set up your billing in 10 minutes! Would you like to check out a quick demo?";
  }

  // Pricing queries
  if (
    text.includes("price") ||
    text.includes("cost") ||
    text.includes("kitna") ||
    text.includes("charges") ||
    text.includes("rate") ||
    text.includes("plan") ||
    text.includes("fees")
  ) {
    return isHindi
      ? "BillEasy ka Starter plan sirf ₹299 per month hai aur Pro plan ₹799 per month hai, saath hi 14 din ka free trial bilkul muft hai. Kya main aapka 14-day free trial shuru kar doon?"
      : "BillEasy starts at just ₹299 per month for Starter and ₹799 for Pro, plus you get a 14-day free trial. Would you like to activate your free trial?";
  }

  // Objection: Expensive
  if (text.includes("expensive") || text.includes("mehenga") || text.includes("jyada") || text.includes("paisa")) {
    return isHindi
      ? "Sir, sirf ek recovered payment pure saal ki fee cover kar leti hai, aur pehle 14 din bilkul free hain. Kya hum free trial se shuru karein?"
      : "Just one recovered late payment covers months of the fee, and our 14-day trial is completely free. Would you like to try the free trial?";
  }

  // Objection: Excel or paper
  if (text.includes("excel") || text.includes("paper") || text.includes("khata") || text.includes("bahi") || text.includes("khatabook")) {
    return isHindi
      ? "Excel ya paper bill se automatic WhatsApp payment reminders aur 30-second GST e-bills nahi ban paate. Kya aap dekhna chahenge BillEasy kaise payment jaldi laata hai?"
      : "Excel doesn't send automatic WhatsApp payment reminders or generate instant GST bills. Would you like to see how BillEasy recovers payments faster?";
  }

  // Objection: No time
  if (text.includes("no time") || text.includes("time nahi") || text.includes("busy") || text.includes("fursat")) {
    return isHindi
      ? "Bilkul samajh sakti hoon, iska setup mobile par sirf 10 minute leta hai aur humari team poori madad karti hai. Kya main kal dopahar ka ek chhota call schedule karoon?"
      : "I completely understand! Setup takes only 10 minutes on mobile and our team helps you for free. Would you like a quick demo later this week?";
  }

  // Objection: Partner / Think
  if (text.includes("think") || text.includes("partner") || text.includes("soch") || text.includes("puch")) {
    return isHindi
      ? "Aap bina ek bhi rupaye diye 14-day free trial dono milkar test kar sakte hain. Kya main aapke WhatsApp par trial activation link bhej doon?"
      : "You and your partner can test the 14-day free trial together without paying anything. Shall I send the WhatsApp trial link?";
  }

  // Demo request
  if (text.includes("demo") || text.includes("dekho") || text.includes("meeting") || text.includes("dikhao")) {
    return isHindi
      ? "Bilkul! Humare specialist aapko 15 minute ka live demo denge aur poora setup karwayenge. Kya kal subah 11 baje ka time aapke liye theek rahega?"
      : "Sure! Our specialist will provide a free 15-minute live demo and setup assistance. Does tomorrow morning at 11 AM work for you?";
  }

  // Trial / Signup
  if (text.includes("trial") || text.includes("yes") || text.includes("haan") || text.includes("start") || text.includes("shuru") || text.includes("sure")) {
    return isHindi
      ? "Shaandar faisla! Main aapke number par 14-day free trial link bhej rahi hoon, jismein koi card nahi lagta. Kya aapka WhatsApp number yahi hai?"
      : "Great choice! I am sending the 14-day free trial activation link to your number with no card required. Is this your primary WhatsApp number?";
  }

  // Greetings
  if (text.includes("hello") || text.includes("hi") || text.includes("namaste") || text.includes("sun") || text.includes("bolo")) {
    return isHindi
      ? "Namaste! Main BillEasy se Riya bol rahi hoon. Kya aapke paas ek minute hoga?"
      : "Hi, this is Riya from BillEasy! Do you have a quick minute to chat about your business billing?";
  }

  // Default discovery
  return isHindi
    ? "BillEasy se aap sirf 30 seconds mein GST bills bana sakte hain aur automatic WhatsApp reminders bhej sakte hain. Kya aapka 14-din ka free trial shuru karein?"
    : "BillEasy lets you make GST bills in 30 seconds and recovers late payments with WhatsApp reminders. Would you like to check out our 14-day free trial?";
}

export async function generateSalesReply(
  history: ChatMessage[],
  language: string = "en-IN"
): Promise<string> {
  const lastUserMsg =
    [...history].reverse().find((m) => m.role === "user")?.content || "";

  const languageInstruction = language.startsWith("hi")
    ? "Reply in natural conversational Hinglish/Hindi."
    : language.startsWith("te")
    ? "Reply in natural conversational Telugu."
    : "Reply in natural, professional Indian English.";

  const contents = history.map((msg) => ({
    role: msg.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: msg.content }],
  }));

  if (contents.length === 0) {
    contents.push({
      role: "user" as const,
      parts: [{ text: "Hello, I just joined the call." }],
    });
  }

  if (!apiKey) {
    return getSpecializedSalesReply(lastUserMsg, language);
  }

  // Try Gemini models with fast timeout and fallback
  const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite"];

  for (const modelName of candidateModels) {
    try {
      const timeoutPromise = new Promise<null>((res) =>
        setTimeout(() => res(null), 4500)
      );

      const callPromise = ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: `${BILLEASY_SYSTEM_PROMPT}\n${languageInstruction}\nRemember: Max 2 short sentences. No lists, no bullets, no emojis. Ask only ONE question.`,
          temperature: 0.65,
        },
      });

      const response = await Promise.race([callPromise, timeoutPromise]);

      if (response && response.text) {
        let cleanText = response.text.trim();
        cleanText = cleanText.replace(/[*#_~`]/g, "");
        cleanText = cleanText.replace(
          /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
          ""
        );
        return cleanText.trim();
      }
    } catch (err: any) {
      // If quota exceeded (429), break to fallback engine
      if (err?.status === 429 || String(err).includes("quota") || String(err).includes("429")) {
        console.warn(`Gemini model ${modelName} hit quota limit, using specialized sales engine.`);
        break;
      }
    }
  }

  // Rule-grounded sales knowledge engine
  return getSpecializedSalesReply(lastUserMsg, language);
}

export async function generateVoiceTTS(
  text: string,
  voiceName: string = "Kore"
): Promise<{ audioBase64: string; mimeType: string } | null> {
  if (!apiKey || !text) {
    return null;
  }

  try {
    const timeoutPromise = new Promise<null>((res) =>
      setTimeout(() => res(null), 3500)
    );

    const callPromise = ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: text,
              speechMetadata: {
                style: "Friendly, confident, warm Indian voice sales representative",
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
          },
        },
      },
    });

    const response = await Promise.race([callPromise, timeoutPromise]);
    if (!response) return null;

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      return {
        audioBase64: base64Audio,
        mimeType: "audio/wav",
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export interface AnalysisOutput {
  summary: string;
  customer_requirements: string[];
  objections: string[];
  next_steps: string[];
  status:
    | "Converted"
    | "Interested"
    | "Follow-up Required"
    | "Not Interested"
    | "Demo Requested"
    | "No Response";
}

export async function analyzeCallTranscript(
  transcript: Array<{ speaker: string; text: string; timestamp?: number }>,
  durationSeconds: number,
  language: string
): Promise<AnalysisOutput> {
  const customerMessages = transcript.filter(
    (m) =>
      m.speaker.toLowerCase() === "customer" ||
      m.speaker.toLowerCase() === "user"
  );

  // If customer never spoke
  if (customerMessages.length === 0 || durationSeconds < 3) {
    return {
      summary: "Customer connected but did not speak or dropped off immediately.",
      customer_requirements: [],
      objections: [],
      next_steps: ["Attempt callback at another time."],
      status: "No Response",
    };
  }

  const transcriptText = transcript
    .map((m) => `${m.speaker.toUpperCase()}: ${m.text}`)
    .join("\n");

  const fullText = transcriptText.toLowerCase();
  let fallbackStatus: AnalysisOutput["status"] = "Interested";
  if (fullText.includes("demo") || fullText.includes("show me") || fullText.includes("meeting") || fullText.includes("dikhao")) {
    fallbackStatus = "Demo Requested";
  } else if (fullText.includes("trial") || fullText.includes("start") || fullText.includes("shuru") || fullText.includes("buy")) {
    fallbackStatus = "Converted";
  } else if (fullText.includes("nahi") || fullText.includes("not interested") || fullText.includes("no thanks")) {
    fallbackStatus = "Not Interested";
  } else if (fullText.includes("kal") || fullText.includes("later") || fullText.includes("call back")) {
    fallbackStatus = "Follow-up Required";
  }

  if (!apiKey) {
    return {
      summary: "Customer engaged in sales conversation regarding BillEasy GST invoicing and WhatsApp payment reminders.",
      customer_requirements: ["GST invoicing in 30 seconds", "WhatsApp payment reminders with UPI links"],
      objections: fullText.includes("expensive") ? ["Price inquiry addressed with free trial"] : [],
      next_steps: ["Send WhatsApp free trial activation link."],
      status: fallbackStatus,
    };
  }

  try {
    const prompt = `Analyze this live sales call for BillEasy (GST billing and WhatsApp payment reminder software):
CALL DURATION: ${durationSeconds} seconds
LANGUAGE: ${language}

FULL TRANSCRIPT:
${transcriptText}

Extract the sales analysis in JSON format adhering strictly to the schema.
Sales status MUST be one of: "Converted", "Interested", "Follow-up Required", "Not Interested", "Demo Requested", "No Response".
If the customer agreed to the 14-day trial or paid, status is "Converted".
If the customer asked for a live demo or meeting, status is "Demo Requested".
If the customer never spoke, status MUST be "No Response".`;

    const timeoutPromise = new Promise<null>((res) =>
      setTimeout(() => res(null), 4500)
    );

    const callPromise = ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Executive summary of the sales conversation.",
            },
            customer_requirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of requirements or tools needed.",
            },
            objections: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of customer objections.",
            },
            next_steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Actionable next steps.",
            },
            status: {
              type: Type.STRING,
              description: "One of: Converted, Interested, Follow-up Required, Not Interested, Demo Requested, No Response",
            },
          },
          required: ["summary", "customer_requirements", "objections", "next_steps", "status"],
        },
      },
    });

    const response = await Promise.race([callPromise, timeoutPromise]);
    if (response && response.text) {
      const parsed = JSON.parse(response.text);
      return {
        summary: parsed.summary || "Call completed regarding BillEasy.",
        customer_requirements: Array.isArray(parsed.customer_requirements) ? parsed.customer_requirements : [],
        objections: Array.isArray(parsed.objections) ? parsed.objections : [],
        next_steps: Array.isArray(parsed.next_steps) ? parsed.next_steps : [],
        status: parsed.status || fallbackStatus,
      };
    }
  } catch (error) {
    // Graceful fallback on quota exhaustion
  }

  return {
    summary: "Customer engaged in sales conversation regarding BillEasy GST invoicing and payment reminders.",
    customer_requirements: ["GST invoicing in 30 seconds", "WhatsApp payment reminders with UPI links"],
    objections: fullText.includes("expensive") ? ["Price inquiry addressed with free trial"] : [],
    next_steps: ["Send WhatsApp free trial activation link."],
    status: fallbackStatus,
  };
}
