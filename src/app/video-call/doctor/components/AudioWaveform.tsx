"use client";

import React, { useEffect, useRef } from "react";

interface AudioWaveformProps {
  stream: MediaStream | null;
  active: boolean;
  barColor?: string;
  barCount?: number;
}

// Canvas-based live mic-level bars, driven by Web Audio's AnalyserNode —
// no server round-trip, purely reacts to the local microphone stream.
const AudioWaveform: React.FC<AudioWaveformProps> = ({
  stream,
  active,
  barColor = "#10b981",
  barCount = 48,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !stream) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextCtor();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const step = Math.max(1, Math.floor(bufferLength / barCount));

    const dpr = window.devicePixelRatio || 1;
    const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.scale(dpr, dpr);

    let rafId: number;
    const draw = () => {
      rafId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      const barWidth = cssWidth / barCount;
      const gap = barWidth * 0.3;
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] || 0;
        const barHeight = Math.max(3, (value / 255) * cssHeight);
        const x = i * barWidth;
        const y = (cssHeight - barHeight) / 2;
        ctx.globalAlpha = 0.4 + (value / 255) * 0.6;
        ctx.fillStyle = barColor;
        ctx.fillRect(x + gap / 2, y, barWidth - gap, barHeight);
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      source.disconnect();
      analyser.disconnect();
      audioCtx.close().catch(() => {});
    };
  }, [active, stream, barColor, barCount]);

  return <canvas ref={canvasRef} className="w-full h-16 block" />;
};

export default AudioWaveform;
