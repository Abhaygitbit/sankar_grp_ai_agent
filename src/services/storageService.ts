import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { CallRecord } from "../types/call";

const DB_NAME = "AIVoiceSalesBotDB";
const STORE_CALLS = "calls";
const STORE_AUDIO = "audio_blobs";
const DB_VERSION = 1;

const SUPABASE_URL_KEY = "TASKFLOW_SUPABASE_URL";
const SUPABASE_KEY_KEY = "TASKFLOW_SUPABASE_ANON_KEY";

// Pre-seeded demo calls for rich first-impression on history page
const SEED_CALLS: CallRecord[] = [
  {
    id: "demo-call-1",
    started_at: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    duration_seconds: 118,
    language: "en-IN",
    status: "Demo Requested",
    summary:
      "Wholesale merchant currently struggling with delayed customer payments and manual paper ledger reconciliation. Interested in automated WhatsApp payment reminders with instant UPI pay links.",
    requirements: [
      "Automatic WhatsApp payment reminders with UPI link",
      "GST invoice creation in 30 seconds from smartphone",
      "Daily sales reports and ledger balance summary",
    ],
    objections: ["Worried about setup complexity - confirmed 10-minute setup with free guided help."],
    next_steps: [
      "Scheduled 15-minute live walkthrough for Thursday at 3 PM",
      "Sent 14-day free trial activation link (no credit card required)",
    ],
    transcript: [
      {
        id: "m1",
        speaker: "bot",
        text: "Hi, this is Riya from BillEasy! Do you have a quick minute to chat about your business billing?",
        timestamp: 1,
      },
      {
        id: "m2",
        speaker: "customer",
        text: "Yes, we run an electronics wholesale shop and our biggest headache is chasing clients for overdue payments.",
        timestamp: 11,
      },
      {
        id: "m3",
        speaker: "bot",
        text: "BillEasy sends automatic WhatsApp payment reminders with direct UPI pay links to recover money 3x faster. Would you like to see a quick 15-minute demo?",
        timestamp: 21,
      },
      {
        id: "m4",
        speaker: "customer",
        text: "That would be very helpful. Can someone show my store manager how it works?",
        timestamp: 33,
      },
      {
        id: "m5",
        speaker: "bot",
        text: "Sure! Our specialist will give a free 15-minute demo and assist with full setup. Would Thursday afternoon work for you?",
        timestamp: 45,
      },
      {
        id: "m6",
        speaker: "customer",
        text: "Thursday 3 PM works great, please book that.",
        timestamp: 55,
      },
    ],
    synced_to_supabase: false,
  },
  {
    id: "demo-call-2",
    started_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    duration_seconds: 92,
    language: "hi-IN",
    status: "Converted",
    summary:
      "Retail cloth merchant agreed to start the 14-day free trial immediately after learning they can make GST invoices directly from their mobile phone in under 30 seconds.",
    requirements: [
      "Fast GST invoice generation on Android phone",
      "WhatsApp invoice sharing with customer",
      "Starter plan at ₹299/month",
    ],
    objections: ["Previously tried Excel but found it too tedious on mobile."],
    next_steps: [
      "Activated 14-day free trial on mobile number",
      "Sent BillEasy WhatsApp quickstart tutorial",
    ],
    transcript: [
      {
        id: "m10",
        speaker: "bot",
        text: "Namaste! Main BillEasy se Riya bol rahi hoon. Kya aapke paas ek minute hoga?",
        timestamp: 1,
      },
      {
        id: "m11",
        speaker: "customer",
        text: "Haan boliye, humari kapde ki dukaan hai aur hum mobile se hi bill banana chahte hain.",
        timestamp: 13,
      },
      {
        id: "m12",
        speaker: "bot",
        text: "BillEasy se aap mobile par sirf 30 seconds mein GST bills bana kar turant WhatsApp par bhej sakte hain. Starter plan sirf ₹299 per month hai aur pehle 14 din bilkul free hain.",
        timestamp: 25,
      },
      {
        id: "m13",
        speaker: "customer",
        text: "Sahi hai, 14 din ka free trial shuru kar dijiye.",
        timestamp: 37,
      },
      {
        id: "m14",
        speaker: "bot",
        text: "Bilkul! Main aapka 14-day free trial activate kar rahi hoon, aap abhi se bills bana sakte hain.",
        timestamp: 48,
      },
    ],
    synced_to_supabase: false,
  },
  {
    id: "demo-call-3",
    started_at: new Date(Date.now() - 3600000 * 22).toISOString(),
    duration_seconds: 65,
    language: "en-IN",
    status: "Follow-up Required",
    summary:
      "Hardware store owner was in the middle of a customer checkout and requested a callback tomorrow afternoon along with a WhatsApp summary of the ₹299 Starter Plan.",
    requirements: ["WhatsApp price breakdown", "Thermal printer bill generation"],
    objections: ["Busy attending store customers."],
    next_steps: [
      "Send BillEasy pricing sheet on WhatsApp",
      "Schedule callback for tomorrow at 2 PM",
    ],
    transcript: [
      {
        id: "m20",
        speaker: "bot",
        text: "Hi, this is Riya from BillEasy! Do you have a quick minute to chat about your business billing?",
        timestamp: 1,
      },
      {
        id: "m21",
        speaker: "customer",
        text: "I am in the middle of billing a customer right now. Can you call me back tomorrow around 2 PM?",
        timestamp: 9,
      },
      {
        id: "m22",
        speaker: "bot",
        text: "Got it! I will call you back tomorrow at 2 PM and send a quick summary on WhatsApp.",
        timestamp: 18,
      },
    ],
    synced_to_supabase: false,
  },
];

// Open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_CALLS)) {
        db.createObjectStore(STORE_CALLS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  return {
    url: localStorage.getItem(SUPABASE_URL_KEY) || "",
    anonKey: localStorage.getItem(SUPABASE_KEY_KEY) || "",
  };
}

export function setSupabaseCredentials(url: string, anonKey: string) {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_KEY_KEY, anonKey.trim());
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();
  if (url && anonKey) {
    try {
      return createClient(url, anonKey);
    } catch (e) {
      console.warn("Invalid Supabase credentials:", e);
      return null;
    }
  }
  return null;
}

export async function saveCallRecord(
  record: CallRecord,
  audioBlob?: Blob
): Promise<{ success: boolean; syncedToSupabase: boolean; error?: string }> {
  try {
    const db = await openDB();

    // 1. Save audio blob locally in IndexedDB if present
    if (audioBlob) {
      const audioTx = db.transaction(STORE_AUDIO, "readwrite");
      const audioStore = audioTx.objectStore(STORE_AUDIO);
      audioStore.put({
        id: record.id,
        blob: audioBlob,
        mimeType: audioBlob.type,
        timestamp: Date.now(),
      });
      await new Promise((res) => (audioTx.oncomplete = res));
    }

    let syncedToSupabase = false;
    let recordingUrl = record.recording_url;

    // 2. Try Supabase if configured
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Upload audio file to Supabase Storage bucket 'call-recordings'
        if (audioBlob) {
          const fileName = `${record.id}.webm`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from("call-recordings")
            .upload(fileName, audioBlob, {
              contentType: audioBlob.type || "audio/webm",
              upsert: true,
            });

          if (!uploadErr && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from("call-recordings")
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              recordingUrl = publicUrlData.publicUrl;
              record.recording_url = recordingUrl;
            }
          } else if (uploadErr) {
            console.warn("Supabase Storage upload warning:", uploadErr.message);
          }
        }

        // Insert into Supabase 'calls' table
        const { error: dbError } = await supabase.from("calls").insert([
          {
            id: record.id,
            started_at: record.started_at,
            duration_seconds: record.duration_seconds,
            language: record.language,
            transcript: record.transcript,
            recording_url: recordingUrl || null,
            summary: record.summary,
            requirements: record.requirements,
            objections: record.objections,
            next_steps: record.next_steps,
            status: record.status,
          },
        ]);

        if (!dbError) {
          syncedToSupabase = true;
          record.synced_to_supabase = true;
        } else {
          console.warn("Supabase table insert warning:", dbError.message);
        }
      } catch (sbErr) {
        console.warn("Supabase sync exception:", sbErr);
      }
    }

    // 3. Save call metadata to IndexedDB
    const callTx = db.transaction(STORE_CALLS, "readwrite");
    const callStore = callTx.objectStore(STORE_CALLS);
    callStore.put(record);
    await new Promise((res) => (callTx.oncomplete = res));

    return { success: true, syncedToSupabase };
  } catch (err: any) {
    console.error("saveCallRecord error:", err);
    return { success: false, syncedToSupabase: false, error: err?.message };
  }
}

export async function getAllCalls(): Promise<CallRecord[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_CALLS, "readonly");
    const store = tx.objectStore(STORE_CALLS);

    const calls: CallRecord[] = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    if (calls.length === 0) {
      // Seed default calls so the history view is immediately populated
      const writeTx = db.transaction(STORE_CALLS, "readwrite");
      const writeStore = writeTx.objectStore(STORE_CALLS);
      for (const call of SEED_CALLS) {
        writeStore.put(call);
      }
      await new Promise((res) => (writeTx.oncomplete = res));
      return SEED_CALLS;
    }

    // Sort newest first
    return calls.sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  } catch (err) {
    console.error("getAllCalls error:", err);
    return SEED_CALLS;
  }
}

export async function getCallAudioBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_AUDIO, "readonly");
    const store = tx.objectStore(STORE_AUDIO);

    const record = await new Promise<any>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (record && record.blob) {
      return record.blob;
    }
    return null;
  } catch (err) {
    console.error("getCallAudioBlob error:", err);
    return null;
  }
}

export async function deleteCallRecord(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_CALLS, STORE_AUDIO], "readwrite");
    tx.objectStore(STORE_CALLS).delete(id);
    tx.objectStore(STORE_AUDIO).delete(id);
    await new Promise((res) => (tx.oncomplete = res));
  } catch (err) {
    console.error("deleteCallRecord error:", err);
  }
}
