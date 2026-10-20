/**
 * Web Audio API Call Mixer
 * Merges Customer Microphone stream + Bot Audio (Gemini TTS) into a single
 * unified MediaStreamDestination recorded via MediaRecorder.
 */

export interface MixerControls {
  audioContext: AudioContext;
  analyser: AnalyserNode;
  playBotAudio: (
    base64Wav: string,
    onEnded?: () => void
  ) => Promise<{ duration: number }>;
  stopBotAudio: () => void;
  stopRecording: () => Promise<Blob>;
  isBotSpeaking: () => boolean;
  getAudioLevel: () => number;
}

export async function createCallAudioMixer(
  micStream: MediaStream
): Promise<MixerControls> {
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextClass();

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  // Master destination for recorder
  const mixedDestination = audioContext.createMediaStreamDestination();

  // Master analyser for live audio visualizer
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;

  // Mic source
  const micSource = audioContext.createMediaStreamSource(micStream);

  // Mic gain control
  const micGain = audioContext.createGain();
  micGain.gain.value = 1.0;

  // Connect Mic -> MicGain -> mixedDestination & analyser
  // (Do NOT connect mic to audioContext.destination to avoid feedback/echo to user's ears)
  micSource.connect(micGain);
  micGain.connect(mixedDestination);
  micGain.connect(analyser);

  // Active bot audio source for interruption support
  let currentBotSource: AudioBufferSourceNode | null = null;
  let currentBotGain: GainNode | null = null;

  // Configure MediaRecorder
  let mimeType = "audio/webm;codecs=opus";
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    if (MediaRecorder.isTypeSupported("audio/webm")) {
      mimeType = "audio/webm";
    } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
      mimeType = "audio/mp4";
    } else {
      mimeType = "";
    }
  }

  const recordedChunks: Blob[] = [];
  const recorder = mimeType
    ? new MediaRecorder(mixedDestination.stream, { mimeType })
    : new MediaRecorder(mixedDestination.stream);

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  recorder.start(250); // Slice chunks every 250ms

  // Helper to decode Base64 to ArrayBuffer
  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Play bot audio buffer through both speakers and recorder
  async function playBotAudio(
    base64Wav: string,
    onEnded?: () => void
  ): Promise<{ duration: number }> {
    stopBotAudio(); // Stop any currently playing audio

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    try {
      const arrayBuffer = base64ToArrayBuffer(base64Wav);
      // audioContext.decodeAudioData detaches the arrayBuffer, so we pass a slice
      const audioBuffer = await audioContext.decodeAudioData(
        arrayBuffer.slice(0)
      );

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      const botGain = audioContext.createGain();
      botGain.gain.value = 1.0;

      // Connect Bot Audio -> BotGain ->
      // 1. mixedDestination (for single combined call recording)
      // 2. audioContext.destination (for user to hear bot)
      // 3. analyser (for waveform visualization)
      source.connect(botGain);
      botGain.connect(mixedDestination);
      botGain.connect(audioContext.destination);
      botGain.connect(analyser);

      currentBotSource = source;
      currentBotGain = botGain;

      source.onended = () => {
        if (currentBotSource === source) {
          currentBotSource = null;
          currentBotGain = null;
        }
        if (onEnded) onEnded();
      };

      source.start(0);
      return { duration: audioBuffer.duration };
    } catch (err) {
      console.warn("Error decoding/playing bot audio:", err);
      if (onEnded) onEnded();
      return { duration: 0 };
    }
  }

  function stopBotAudio() {
    if (currentBotSource) {
      try {
        currentBotSource.stop();
      } catch (e) {
        // already stopped
      }
      currentBotSource = null;
      currentBotGain = null;
    }
  }

  function isBotSpeaking(): boolean {
    return currentBotSource !== null;
  }

  function getAudioLevel(): number {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return Math.min(100, Math.round((sum / dataArray.length) * 1.5));
  }

  function stopRecording(): Promise<Blob> {
    stopBotAudio();
    return new Promise((resolve) => {
      recorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, {
          type: mimeType || "audio/webm",
        });
        // Stop all tracks on mic stream
        micStream.getTracks().forEach((track) => track.stop());
        try {
          audioContext.close();
        } catch (e) {
          // ignore
        }
        resolve(finalBlob);
      };

      if (recorder.state !== "inactive") {
        recorder.stop();
      } else {
        const finalBlob = new Blob(recordedChunks, {
          type: mimeType || "audio/webm",
        });
        resolve(finalBlob);
      }
    });
  }

  return {
    audioContext,
    analyser,
    playBotAudio,
    stopBotAudio,
    stopRecording,
    isBotSpeaking,
    getAudioLevel,
  };
}
