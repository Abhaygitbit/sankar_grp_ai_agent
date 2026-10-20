/**
 * Web Speech API Service - Ultra-Resilient Engine for CloserAI
 * Wraps SpeechRecognition / webkitSpeechRecognition
 * Guarantees continuous speech listening, handles interim results,
 * auto-recovers from browser silence dropouts, and supports instant interruption.
 */

export interface SpeechServiceCallbacks {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (isListening: boolean) => void;
}

export class SpeechService {
  private recognition: any = null;
  private isExplicitlyStopped: boolean = false;
  private isListeningActive: boolean = false;
  private currentLanguage: string = "en-IN";
  private callbacks: SpeechServiceCallbacks;
  private watchdogTimer: any = null;
  private restartTimeout: any = null;

  constructor(callbacks: SpeechServiceCallbacks, language: string = "en-IN") {
    this.callbacks = callbacks;
    this.currentLanguage = language;
    this.initRecognition();
    this.startWatchdog();
  }

  public static isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      Boolean(
        (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
      )
    );
  }

  private initRecognition() {
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      if (this.callbacks.onError) {
        this.callbacks.onError(
          "Speech recognition is not supported in this browser."
        );
      }
      return;
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch (e) {}
      }

      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        if (this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange(true);
        }
      };

      this.recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || "";
          if (item.isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim.trim()) {
          this.callbacks.onInterim(interim.trim());
        }

        if (final.trim()) {
          this.callbacks.onFinal(final.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        // Normal conversation events like 'no-speech' or 'aborted' are non-fatal
        if (event.error === "no-speech") {
          // Normal pause in speech, will restart on onend
          return;
        }

        if (event.error !== "aborted") {
          console.warn("Speech recognition warning:", event.error);
          if (this.callbacks.onError) {
            this.callbacks.onError(event.error);
          }
        }
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        if (this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange(false);
        }

        // Auto-restart immediately if call is active
        if (!this.isExplicitlyStopped) {
          this.scheduleRestart(100);
        }
      };
    } catch (err) {
      console.error("Failed to initialize SpeechRecognition:", err);
    }
  }

  private scheduleRestart(delayMs: number = 100) {
    if (this.isExplicitlyStopped) return;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);

    this.restartTimeout = setTimeout(() => {
      if (!this.isExplicitlyStopped && !this.isListeningActive) {
        this.safeStart();
      }
    }, delayMs);
  }

  private safeStart() {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (this.recognition && !this.isListeningActive && !this.isExplicitlyStopped) {
      try {
        this.recognition.lang = this.currentLanguage;
        this.recognition.start();
      } catch (e: any) {
        // If recognition entered an invalid state (e.g. already starting or dead), re-init
        if (e?.name === "InvalidStateError" || e?.message?.includes("started")) {
          // Already running or starting
          this.isListeningActive = true;
        } else {
          // Re-instantiate if wedged
          this.initRecognition();
          try {
            this.recognition?.start();
          } catch (err) {}
        }
      }
    }
  }

  // Watchdog heartbeat to prevent Chrome silent disconnection after queries
  private startWatchdog() {
    this.watchdogTimer = setInterval(() => {
      if (!this.isExplicitlyStopped && !this.isListeningActive) {
        this.safeStart();
      }
    }, 700);
  }

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
      if (!this.isExplicitlyStopped) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }
    }
  }

  public start() {
    this.isExplicitlyStopped = false;
    this.safeStart();
  }

  public pause() {
    // We intentionally keep recognition active for interruption capability,
    // but the caller can suppress audio if needed.
  }

  public resume() {
    this.isExplicitlyStopped = false;
    if (!this.isListeningActive) {
      this.safeStart();
    }
  }

  public stop() {
    this.isExplicitlyStopped = true;
    this.isListeningActive = false;
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }
  }
}
