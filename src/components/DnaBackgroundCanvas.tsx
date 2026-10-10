// src/components/DnaBackgroundCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';

interface DnaBackgroundCanvasProps {
  interactive?: boolean;
}

export const DnaBackgroundCanvas: React.FC<DnaBackgroundCanvasProps> = ({ interactive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [animating, setAnimating] = useState<boolean>(true);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const { innerWidth, innerHeight } = window;
      mouseRef.current.targetX = (e.clientX / innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Helix configuration
    const numBasePairs = 48;
    const helixRadius = Math.min(width * 0.16, 120);
    const strandSpacing = Math.max(height * 1.3, 1100);
    const rotationSpeed = 0.009;
    let angle = 0;

    // Ambient floating particles
    const particleCount = 42;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: (Math.random() - 0.5) * 400,
      radius: Math.random() * 1.8 + 0.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      color: Math.random() > 0.5 ? 'rgba(45, 212, 191, ' : 'rgba(56, 189, 248, ',
      alpha: Math.random() * 0.4 + 0.1,
    }));

    // Nucleotide types with distinct complementary colors
    const basePairs = Array.from({ length: numBasePairs }).map((_, i) => ({
      type: i % 4, // 0: A-T, 1: G-C, 2: T-A, 3: C-G
      labelA: ['A', 'G', 'T', 'C'][i % 4],
      labelB: ['T', 'C', 'A', 'G'][i % 4],
    }));

    const render = () => {
      if (!animating) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse follow
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      angle += rotationSpeed;

      // Render floating ambient particles with depth
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();
      });

      // DNA Helix Center and tilt
      const centerX = width * 0.82 + mouseRef.current.x * 35;
      const centerY = height * 0.5;
      const tiltX = (mouseRef.current.y * Math.PI) / 14 + 0.22; // subtle inclination
      const cosTilt = Math.cos(tiltX);
      const sinTilt = Math.sin(tiltX);

      // Collect all 3D points for depth sorting
      type Node3D = {
        strand: 1 | 2;
        screenX: number;
        screenY: number;
        z: number;
        rawZ: number;
        index: number;
        color: string;
      };

      const nodesStrand1: Node3D[] = [];
      const nodesStrand2: Node3D[] = [];
      const rungs: { n1: Node3D; n2: Node3D; zAvg: number; type: number }[] = [];

      for (let i = 0; i < numBasePairs; i++) {
        // Linear position along helix length
        const progress = i / numBasePairs - 0.5;
        const yLinear = progress * strandSpacing;

        // Angular twist: 3.5 full helical turns
        const theta = angle + progress * Math.PI * 7;

        // 3D coordinates before camera tilt
        const x1 = Math.cos(theta) * helixRadius;
        const z1 = Math.sin(theta) * helixRadius;

        const x2 = -x1;
        const z2 = -z1;

        // Apply tilt rotation around X-axis
        const yRot1 = yLinear * cosTilt - z1 * sinTilt;
        const zRot1 = yLinear * sinTilt + z1 * cosTilt;

        const yRot2 = yLinear * cosTilt - z2 * sinTilt;
        const zRot2 = yLinear * sinTilt + z2 * cosTilt;

        // Perspective projection factor
        const perspective = 700;
        const scale1 = perspective / (perspective + zRot1);
        const scale2 = perspective / (perspective + zRot2);

        const screenX1 = centerX + x1 * scale1;
        const screenY1 = centerY + yRot1 * scale1;

        const screenX2 = centerX + x2 * scale2;
        const screenY2 = centerY + yRot2 * scale2;

        const bp = basePairs[i];
        const color1 = bp.type % 2 === 0 ? '#14b8a6' : '#06b6d4'; // Teal vs Cyan
        const color2 = bp.type % 2 === 0 ? '#38bdf8' : '#10b981'; // Sky vs Emerald

        const node1: Node3D = {
          strand: 1,
          screenX: screenX1,
          screenY: screenY1,
          z: zRot1,
          rawZ: z1,
          index: i,
          color: color1,
        };

        const node2: Node3D = {
          strand: 2,
          screenX: screenX2,
          screenY: screenY2,
          z: zRot2,
          rawZ: z2,
          index: i,
          color: color2,
        };

        nodesStrand1.push(node1);
        nodesStrand2.push(node2);

        rungs.push({
          n1: node1,
          n2: node2,
          zAvg: (zRot1 + zRot2) / 2,
          type: bp.type,
        });
      }

      // 1. Draw connecting base pair rungs (hydrogen bonds) sorted from back to front
      rungs.sort((a, b) => b.zAvg - a.zAvg);

      rungs.forEach((r) => {
        // Opacity depends on average depth
        const depthAlpha = Math.max(0.08, Math.min(0.55, 0.35 - r.zAvg / 500));

        // Create linear gradient across hydrogen bond rung
        const grad = ctx.createLinearGradient(r.n1.screenX, r.n1.screenY, r.n2.screenX, r.n2.screenY);
        grad.addColorStop(0, `rgba(45, 212, 191, ${depthAlpha})`);
        grad.addColorStop(0.5, `rgba(148, 163, 184, ${depthAlpha * 0.7})`);
        grad.addColorStop(1, `rgba(56, 189, 248, ${depthAlpha})`);

        ctx.beginPath();
        ctx.moveTo(r.n1.screenX, r.n1.screenY);
        ctx.lineTo(r.n2.screenX, r.n2.screenY);
        ctx.lineWidth = Math.max(1, 1.8 * (1 - r.zAvg / 600));
        ctx.strokeStyle = grad;
        ctx.stroke();

        // Optional central hydrogen bond dot
        const midX = (r.n1.screenX + r.n2.screenX) / 2;
        const midY = (r.n1.screenY + r.n2.screenY) / 2;
        ctx.beginPath();
        ctx.arc(midX, midY, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${depthAlpha * 0.8})`;
        ctx.fill();
      });

      // 2. Draw continuous backbone strands
      const drawBackbone = (nodes: Node3D[], color: string) => {
        ctx.beginPath();
        for (let i = 0; i < nodes.length - 1; i++) {
          const current = nodes[i];
          const next = nodes[i + 1];
          const midX = (current.screenX + next.screenX) / 2;
          const midY = (current.screenY + next.screenY) / 2;

          if (i === 0) {
            ctx.moveTo(current.screenX, current.screenY);
          }
          ctx.quadraticCurveTo(current.screenX, current.screenY, midX, midY);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      };

      drawBackbone(nodesStrand1, 'rgba(45, 212, 191, 0.35)');
      drawBackbone(nodesStrand2, 'rgba(56, 189, 248, 0.35)');

      // 3. Draw nucleotide phosphate nodes sorted back to front
      const allNodes = [...nodesStrand1, ...nodesStrand2].sort((a, b) => b.z - a.z);

      allNodes.forEach((node) => {
        // Node size and glow scaled with depth
        const depthFactor = Math.max(0.3, Math.min(1.4, 1 - node.z / 350));
        const radius = Math.max(2, 4.2 * depthFactor);
        const alpha = Math.max(0.18, Math.min(0.9, 0.5 - node.z / 400));

        // Outer glow on front-facing nodes
        if (node.z < 0) {
          const glowGrad = ctx.createRadialGradient(
            node.screenX,
            node.screenY,
            0,
            node.screenX,
            node.screenY,
            radius * 2.8
          );
          glowGrad.addColorStop(0, `rgba(45, 212, 191, ${alpha * 0.45})`);
          glowGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = glowGrad;
          ctx.fill();
        }

        // Core solid nucleotide bead
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.strand === 1 ? `rgba(45, 212, 191, ${alpha})` : `rgba(56, 189, 248, ${alpha})`;
        ctx.fill();

        // Inner specular highlight
        if (node.z < 50) {
          ctx.beginPath();
          ctx.arc(node.screenX - radius * 0.3, node.screenY - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [animating]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 transition-opacity duration-1000" />

      {/* Subtle radial vignette and gradient overlay to guarantee 100% WCAG AA text contrast */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/85 to-slate-950/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,148,136,0.12),rgba(2,6,23,0))]" />

      {/* Discrete user pause/play animation control in bottom right */}
      <div className="absolute bottom-3 right-3 pointer-events-auto z-10 hidden sm:block">
        <button
          onClick={() => setAnimating((prev) => !prev)}
          className="text-[10px] font-mono text-slate-500 hover:text-teal-400 bg-slate-900/80 hover:bg-slate-900 px-2 py-1 rounded border border-slate-800 transition-colors"
          title="Toggle Background DNA Helix Animation"
        >
          DNA Helix: {animating ? 'Active (60fps)' : 'Paused'}
        </button>
      </div>
    </div>
  );
};
