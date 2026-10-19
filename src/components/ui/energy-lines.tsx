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

    // Handle high-DPI screens for crisp lines
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

    // Generate 20 flowing light ribbons
    const lines = Array.from({ length: 20 }).map(() => ({
      y: Math.random() * height * 1.5 - height * 0.25,
      speed: Math.random() * 1.5 + 0.5,       // How fast it moves left/right
      amplitude: Math.random() * 60 + 20,     // How high the waves go
      frequency: Math.random() * 0.003 + 0.001,// How tight the waves are
      phase: Math.random() * Math.PI * 2,
      width: Math.random() * 1.5 + 0.5,
      color: Math.random() > 0.7 ? '#FFFFFF' : (Math.random() > 0.5 ? '#00FFFF' : '#3B82F6'),
      opacity: Math.random() * 0.3 + 0.05,    // Subtle opacity
      tilt: Math.random() * 0.15 + 0.05       // Diagonal angle
    }));

    const draw = () => {
      // Clear canvas completely each frame
      ctx.clearRect(0, 0, width, height);
      
      // 'lighter' makes overlapping light areas brighter (additive blending)
      ctx.globalCompositeOperation = 'lighter';
      time += 0.015;

      lines.forEach(line => {
        ctx.beginPath();
        
        // Draw the curve across the screen
        for (let x = -100; x < width + 100; x += 15) {
          // Sine wave math for smooth flowing curves
          const wave = Math.sin(x * line.frequency + time * line.speed + line.phase) * line.amplitude;
          const y = line.y + wave + (x * line.tilt); // Add tilt for diagonal flow

          if (x === -100) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Draw the core bright line
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.globalAlpha = line.opacity;
        ctx.shadowBlur = 15;
        ctx.shadowColor = line.color;
        ctx.stroke();

        // Draw a thicker, softer glow around the core
        ctx.lineWidth = line.width * 4;
        ctx.globalAlpha = line.opacity * 0.2;
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