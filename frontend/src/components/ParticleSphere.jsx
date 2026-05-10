import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ParticleSphere() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const particles = [];
    const numParticles = 300;
    const radius = Math.min(width, height) * 0.35;
    
    // Create particles on a sphere
    for (let i = 0; i < numParticles; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      particles.push({
        x0: radius * Math.sin(phi) * Math.cos(theta),
        y0: radius * Math.sin(phi) * Math.sin(theta),
        z0: radius * Math.cos(phi),
        x: 0, y: 0, z: 0
      });
    }

    let angleX = 0;
    let angleY = 0;
    
    let animationFrameId;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Determine color based on theme
      const color = theme === 'dark' ? 'rgba(212, 175, 55, ' : 'rgba(10, 11, 14, ';
      
      // Rotate
      angleX += 0.002;
      angleY += 0.003;
      
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      particles.forEach(p => {
        // Rotate around Y
        let x1 = p.x0 * cosY - p.z0 * sinY;
        let z1 = p.z0 * cosY + p.x0 * sinY;
        
        // Rotate around X
        let y1 = p.y0 * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y0 * sinX;
        
        // Perspective projection
        const scale = 400 / (400 + z2);
        const x2 = (width / 2) + x1 * scale;
        const y2 = (height / 2) + y1 * scale;
        
        // Draw
        const opacity = Math.max(0, Math.min(1, scale - 0.5));
        ctx.beginPath();
        ctx.arc(x2, y2, scale * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none -z-10"
    />
  );
}
