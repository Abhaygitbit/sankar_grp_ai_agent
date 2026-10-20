import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
  speaker: "bot" | "customer" | "none";
}

export function AudioVisualizer({
  analyser,
  isActive,
  speaker,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyser && isActive) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Idle gentle waveform
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = isActive ? 15 : 4;
        }
      }

      // Draw bars
      const barCount = 36;
      const barWidth = Math.max(3, (width / barCount) - 3);
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * (bufferLength / 2));
        const val = dataArray[dataIndex] || 0;
        const normalized = val / 255;
        const barHeight = Math.max(4, normalized * (height * 0.85));

        // Color based on speaker
        let gradient = ctx.createLinearGradient(0, height, 0, 0);
        if (speaker === "bot") {
          // Purple to Indigo for Bot
          gradient.addColorStop(0, "#4f46e5");
          gradient.addColorStop(0.5, "#818cf8");
          gradient.addColorStop(1, "#c084fc");
        } else if (speaker === "customer") {
          // Cyan to Emerald for Customer
          gradient.addColorStop(0, "#059669");
          gradient.addColorStop(0.5, "#10b981");
          gradient.addColorStop(1, "#34d399");
        } else {
          // Muted slate
          gradient.addColorStop(0, "#334155");
          gradient.addColorStop(1, "#64748b");
        }

        ctx.fillStyle = gradient;
        // Rounded bar centered vertically
        const y = (height - barHeight) / 2;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 3);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();

        x += barWidth + 3;
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, isActive, speaker]);

  return (
    <div className="relative w-full h-20 bg-slate-900/80 rounded-2xl border border-slate-800/80 p-2 flex items-center justify-center overflow-hidden shadow-inner">
      <div className="absolute inset-0 bg-radial from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      <canvas
        ref={canvasRef}
        width={380}
        height={70}
        className="w-full h-full max-w-md block"
      />
    </div>
  );
}
