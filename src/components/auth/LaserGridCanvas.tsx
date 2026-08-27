import React, { useEffect, useRef } from 'react';

interface LaserGridCanvasProps {
  className?: string;
  theme?: 'cyber' | 'rose';
}

export function LaserGridCanvas({ className = '', theme = 'cyber' }: LaserGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Laser beam vertical lines (similar to the image reference)
    const lineCount = Math.min(Math.floor(width / 35), 40);
    const lines = Array.from({ length: lineCount }, (_, i) => ({
      x: (width / lineCount) * i + Math.random() * 20,
      length: 60 + Math.random() * 180,
      y: Math.random() * height,
      speed: 0.8 + Math.random() * 1.8,
      width: 1 + Math.random() * 1.5,
      alpha: 0.15 + Math.random() * 0.4,
    }));

    // Floating particles
    const particleCount = 35;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.2 - Math.random() * 0.4,
      alpha: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * Math.PI * 2,
    }));

    let gridOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isCyber = theme === 'cyber';
      const beamColorStart = isCyber ? 'rgba(79, 70, 229,' : 'rgba(225, 29, 72,'; // Indigo / Rose
      const beamColorEnd = isCyber ? 'rgba(59, 130, 246,' : 'rgba(251, 113, 133,'; // Blue / Light Rose
      const particleColor = isCyber ? 'rgba(99, 102, 241,' : 'rgba(244, 114, 182,';

      // 1. Draw subtle background vertical grid guides
      ctx.strokeStyle = isCyber ? 'rgba(30, 41, 59, 0.35)' : 'rgba(76, 29, 44, 0.3)';
      ctx.lineWidth = 1;
      const gridSpacing = 60;
      for (let x = 0; x <= width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 2. Draw animated streaming vertical laser beams
      lines.forEach((line) => {
        line.y -= line.speed;
        if (line.y + line.length < 0) {
          line.y = height + Math.random() * 50;
          line.x = Math.random() * width;
        }

        const gradient = ctx.createLinearGradient(line.x, line.y, line.x, line.y + line.length);
        gradient.addColorStop(0, `${beamColorStart} 0)`);
        gradient.addColorStop(0.5, `${beamColorEnd} ${line.alpha})`);
        gradient.addColorStop(1, `${beamColorStart} 0)`);

        ctx.beginPath();
        ctx.lineWidth = line.width;
        ctx.strokeStyle = gradient;
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x, line.y + line.length);
        ctx.stroke();

        // Glow head dot on top of line
        ctx.beginPath();
        ctx.arc(line.x, line.y, line.width * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `${beamColorEnd} ${line.alpha * 1.2})`;
        ctx.fill();
      });

      // 3. Draw ambient glowing floating particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.03;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const currentAlpha = Math.max(0.1, p.alpha + Math.sin(p.pulse) * 0.25);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${particleColor} ${currentAlpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${particleColor} 0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Subtle bottom horizontal laser sweep
      gridOffset += 0.5;
      ctx.beginPath();
      ctx.strokeStyle = isCyber ? 'rgba(99, 102, 241, 0.15)' : 'rgba(244, 114, 182, 0.15)';
      ctx.lineWidth = 1.5;
      const yLine = (height * 0.85 + gridOffset) % height;
      ctx.moveTo(0, yLine);
      ctx.lineTo(width, yLine);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
