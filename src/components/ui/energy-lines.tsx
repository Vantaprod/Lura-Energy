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
    canvas.width = width;
    canvas.height = height;

    const lines: any[] = [];
    const numLines = 25; // Number of moving lines

    // Initialize lines
    for (let i = 0; i < numLines; i++) {
      lines.push({
        x: Math.random() * width,
        y: Math.random() * height,
        dx: (Math.random() - 0.5) * 2, // Speed X (slow motion)
        dy: (Math.random() - 0.5) * 2, // Speed Y (slow motion)
        length: Math.random() * 150 + 50,
        color: Math.random() > 0.5 ? '#00FFFF' : '#3B82F6', // Cyan and Blue
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 0.15; // Subtle opacity so text stays readable

      for (const line of lines) {
        // Calculate tail position
        const tailX = line.x - line.dx * line.length;
        const tailY = line.y - line.dy * line.length;

        // Create gradient for the energy tail
        const grad = ctx.createLinearGradient(line.x, line.y, tailX, tailY);
        grad.addColorStop(0, line.color);
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Move the line
        line.x += line.dx;
        line.y += line.dy;

        // Reset if it goes off screen (creates continuous flow)
        if (
          line.x < -line.length || 
          line.x > width + line.length || 
          line.y < -line.length || 
          line.y > height + line.length
        ) {
          line.x = Math.random() * width;
          line.y = Math.random() * height;
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
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
        zIndex: 0
      }} 
    />
  );
}