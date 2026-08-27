'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ColorPalette } from '@/lib/types';
import { RotateCw, Eye, Sparkles, Cylinder, Maximize2 } from 'lucide-react';

interface TilingPreviewProps {
  grid: number[][];
  palette: ColorPalette;
  repeats?: number;
  motifWidth?: number;
}

export const TilingPreview: React.FC<TilingPreviewProps> = ({
  grid,
  palette,
  repeats = 14,
  motifWidth = 15,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastMouseX, setLastMouseX] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'cylinder' | 'ribbon'>('cylinder');

  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // Auto-spin animation frame
  useEffect(() => {
    if (!isAutoSpinning || isDragging || viewMode !== 'cylinder') return;

    const interval = setInterval(() => {
      setRotationAngle((a) => (a + 0.015) % (Math.PI * 2));
    }, 30);

    return () => clearInterval(interval);
  }, [isAutoSpinning, isDragging, viewMode]);

  // Cylinder / Ribbon rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (viewMode === 'ribbon') {
      // 2D Ribbon / Seamless Band View
      const ribbonHeight = Math.min(180, height - 40);
      const cellH = ribbonHeight / rows;
      const cellW = cellH; // Square stitch aspect ratio
      const startY = (height - ribbonHeight) / 2;

      // Draw tiled background
      const totalWidthDrawn = cols * cellW;
      const startX = ((width - totalWidthDrawn) / 2) > 0 ? (width - totalWidthDrawn) / 2 : 20;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const st = grid[r]?.[c] ?? 0;
          const hex = palette[st]?.hex || '#FFF';
          ctx.fillStyle = hex;
          ctx.fillRect(startX + c * cellW, startY + r * cellH, cellW, cellH);
        }
      }

      // Draw outer boundary
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, startY, totalWidthDrawn, ribbonHeight);
      return;
    }

    // 3D Simulated Bohra Topi Cylinder
    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const radiusX = Math.min(width * 0.38, 160);
    const radiusY = radiusX * 0.28; // Isometric tilt
    const cylinderHeight = Math.min(height * 0.48, 140);
    const topY = centerY - cylinderHeight / 2;
    const bottomY = centerY + cylinderHeight / 2;

    // 1. Draw Back Half of Top Rim
    ctx.strokeStyle = '#E3DDD2';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(centerX, topY, radiusX, radiusY, 0, Math.PI, 2 * Math.PI);
    ctx.stroke();

    // 2. Draw Crown Dome Cap on Top
    const crownGradient = ctx.createRadialGradient(
      centerX,
      topY - 5,
      10,
      centerX,
      topY,
      radiusX
    );
    crownGradient.addColorStop(0, '#FFFFFF');
    crownGradient.addColorStop(0.7, '#F7F4EC');
    crownGradient.addColorStop(1, '#E6DFCE');

    ctx.fillStyle = crownGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, topY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Small Gold Crown Button in Center (Chhat Center)
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(centerX, topY, 4, 0, 2 * Math.PI);
    ctx.fill();

    // 3. Render Cylindrical Side Wall (Raycast / Projection of Kinar columns)
    const numVisibleSegments = 100;
    const rowH = cylinderHeight / rows;

    for (let seg = 0; seg < numVisibleSegments; seg++) {
      // Angle spanning front arc: from PI/2 - PI/2 to 3PI/2 etc.
      // Front half is theta from 0 to PI
      const theta = (seg / numVisibleSegments) * Math.PI;
      const angle = theta + rotationAngle;

      // Project 3D cylinder column to 2D X
      const x1 = centerX + radiusX * Math.cos(angle);
      const x2 = centerX + radiusX * Math.cos(angle + Math.PI / numVisibleSegments);

      // Map cylinder 360 angle to grid column index
      const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const colFloat = (normalizedAngle / (Math.PI * 2)) * cols;
      const col = Math.floor(colFloat) % cols;

      // Lighting & Shading based on normal angle
      const lighting = Math.sin(theta); // 0 at edges, 1 at center
      const shadowFactor = 0.5 + 0.5 * lighting;

      for (let r = 0; r < rows; r++) {
        const stitchId = grid[r]?.[col] ?? 0;
        const colorItem = palette[stitchId];
        const hex = colorItem?.hex || '#FFFFFF';

        ctx.fillStyle = shadeColor(hex, shadowFactor);
        const yTop = topY + r * rowH + radiusY * Math.sin(angle);
        const yBottom = yTop + rowH;

        ctx.beginPath();
        ctx.rect(x1, yTop, Math.max(1, x2 - x1 + 0.5), rowH + 0.5);
        ctx.fill();
      }
    }

    // 4. Draw Front Lower Rim & Top Rim Curves
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;

    // Bottom Rim
    ctx.beginPath();
    ctx.ellipse(centerX, bottomY, radiusX, radiusY, 0, 0, Math.PI);
    ctx.stroke();

    // Top Rim front edge
    ctx.beginPath();
    ctx.ellipse(centerX, topY, radiusX, radiusY, 0, 0, Math.PI);
    ctx.stroke();

    // Cylinder left and right silhouettes
    ctx.beginPath();
    ctx.moveTo(centerX - radiusX, topY);
    ctx.lineTo(centerX - radiusX, bottomY);
    ctx.moveTo(centerX + radiusX, topY);
    ctx.lineTo(centerX + radiusX, bottomY);
    ctx.stroke();

  }, [grid, palette, rotationAngle, viewMode, rows, cols]);

  // Drag interaction
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (viewMode !== 'cylinder') return;
    setIsDragging(true);
    setLastMouseX(e.clientX);
    setIsAutoSpinning(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || viewMode !== 'cylinder') return;
    const deltaX = e.clientX - lastMouseX;
    setLastMouseX(e.clientX);
    setRotationAngle((a) => a - deltaX * 0.015);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="bg-white rounded-xl border border-bohra-border p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cylinder className="w-4 h-4 text-gold-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-bohra-text">
            3D Bohra Topi Cylindrical Preview
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'cylinder' ? 'ribbon' : 'cylinder')}
            className="text-[11px] font-medium text-bohra-text bg-bohra-paper hover:bg-gold-50 border border-bohra-border px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
          >
            <Eye className="w-3 h-3 text-gold-600" />
            <span>{viewMode === 'cylinder' ? 'Flat Ribbon View' : '3D Cylinder View'}</span>
          </button>

          {viewMode === 'cylinder' && (
            <button
              onClick={() => setIsAutoSpinning(!isAutoSpinning)}
              className={`p-1 rounded-lg border transition-colors ${
                isAutoSpinning ? 'bg-gold-50 text-gold-700 border-gold-400' : 'bg-white text-bohra-muted border-bohra-border'
              }`}
              title="Toggle Auto Spin"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isAutoSpinning ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Display */}
      <div className="relative w-full h-[240px] bg-gradient-to-b from-bohra-paper/80 to-bohra-cream rounded-xl border border-bohra-border flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={480}
          height={240}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`cursor-${viewMode === 'cylinder' ? 'grab' : 'default'} active:cursor-grabbing select-none`}
        />

        {viewMode === 'cylinder' && (
          <div className="absolute bottom-2 left-3 text-[10px] text-bohra-muted bg-white/80 backdrop-blur px-2 py-0.5 rounded border border-bohra-border">
            Drag left/right to rotate 360°
          </div>
        )}

        <div className="absolute bottom-2 right-3 text-[10px] text-bohra-muted bg-white/80 backdrop-blur px-2 py-0.5 rounded border border-bohra-border">
          {repeats} Repeats • {cols} Total Stitches
        </div>
      </div>
    </div>
  );
};

// Shading utility for 3D depth illusion
function shadeColor(hex: string, factor: number): string {
  if (!hex || !hex.startsWith('#')) return hex;
  const cleanHex = hex.replace('#', '');
  const r = Math.min(255, Math.floor(parseInt(cleanHex.substring(0, 2), 16) * factor));
  const g = Math.min(255, Math.floor(parseInt(cleanHex.substring(2, 4), 16) * factor));
  const b = Math.min(255, Math.floor(parseInt(cleanHex.substring(4, 6), 16) * factor));
  return `rgb(${r}, ${g}, ${b})`;
}
