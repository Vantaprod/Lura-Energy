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
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Use dark, subtle blues to blend with the footer background (#0A1550)
    const colors = ['#1E3A8A', '#1D4ED8', '#2563EB', '#0A1550'];

    const lines = Array.from({ length: 15 }).map(() => ({
      // Start y slightly below the top edge so it doesn't draw a harsh line at y=0
      y: Math.random() * height * 1.2 + 10, 
      speed: Math.random() * 0.5 + 0.2,       // Much slower
      amplitude: Math.random() * 40 + 20,     
      frequency: Math.random() * 0.002 + 0.001,
      phase: Math.random() * Math.PI * 2,
      width: Math.random() * 1 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.1 + 0.02,    // Very subtle
      tilt: Math.random() * 0.1 + 0.05       
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      
      // Slower time progression
      time += 0.005;

      lines.forEach(line => {
        ctx.beginPath();
        
        for (let x = -100; x < width + 100; x += 15) {
          const wave = Math.sin(x * line.frequency + time * line.speed + line.phase) * line.amplitude;
          const y = line.y + wave + (x * line.tilt);

          if (x === -100) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Core line
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.globalAlpha = line.opacity;
        ctx.shadowBlur = 10;
        ctx.shadowColor = line.color;
        ctx.stroke();

        // Soft glow
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
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}