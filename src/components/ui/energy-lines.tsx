'use client';

import { useEffect, useRef } from 'react';

export function EnergyLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = parent.clientWidth;
        height = parent.clientHeight;
        canvas.width = width;
        canvas.height = height;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const lines = Array.from({ length: 15 }).map(() => ({
      y: Math.random() * 400 + 50,
      speed: Math.random() * 0.5 + 0.2,
      amplitude: Math.random() * 40 + 20,
      frequency: Math.random() * 0.002 + 0.001,
      phase: Math.random() * Math.PI * 2,
      width: Math.random() * 1 + 0.5,
      color: ['#1E3A8A', '#1D4ED8', '#2563EB'][Math.floor(Math.random() * 3)],
      opacity: Math.random() * 0.1 + 0.02,
      tilt: Math.random() * 0.1 + 0.05
    }));

    let time = 0;
    const draw = () => {
      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      time += 0.005;

      lines.forEach(line => {
        ctx.beginPath();
        for (let x = -100; x < width + 100; x += 15) {
          const wave = Math.sin(x * line.frequency + time * line.speed + line.phase) * line.amplitude;
          const y = line.y + wave + (x * line.tilt);
          if (x === -100) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.globalAlpha = line.opacity;
        ctx.shadowBlur = 10;
        ctx.shadowColor = line.color;
        ctx.stroke();
        
        ctx.lineWidth = line.width * 3;
        ctx.globalAlpha = line.opacity * 0.3;
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
      }}
    />
  );
}