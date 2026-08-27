'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ColorPalette } from '@/lib/types';
import {
  traceImageToGrid,
  TraceOptions,
  TracedResult,
  TracingAlgorithm,
  CropRect,
} from '@/lib/tracer';
import { tileMotifMatrix } from '@/lib/scaling';
import {
  Upload,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Eye,
  Layers,
  Image as ImageIcon,
  Cylinder,
  Sun,
  Contrast,
  SlidersHorizontal,
  Crop,
  Paintbrush,
  Eraser,
  Undo2,
  Minimize2,
  Maximize2,
  FlipHorizontal,
  Wand2,
} from 'lucide-react';

interface ImageTracerModalProps {
  palette: ColorPalette;
  currentRows: number;
  currentMotifWidth: number;
  totalRepeats: number;
  onApplyTracedGrid: (result: {
    grid: number[][];
    motifWidth: number;
    mode: 'motif' | 'full';
  }) => void;
  onClose: () => void;
}

export const ImageTracerModal: React.FC<ImageTracerModalProps> = ({
  palette,
  currentRows = 24,
  currentMotifWidth = 15,
  totalRepeats = 14,
  onApplyTracedGrid,
  onClose,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [traceMode, setTraceMode] = useState<'motif' | 'full'>('motif');

  // Algorithm & Core Sliders
  const [algorithm, setAlgorithm] = useState<TracingAlgorithm>('adaptive');
  const [targetRows, setTargetRows] = useState<number>(currentRows || 24);
  const [targetCols, setTargetCols] = useState<number>(currentMotifWidth || 15);
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(20);
  const [threshold, setThreshold] = useState<number>(50);
  const [kasabSensitivity, setKasabSensitivity] = useState<number>(60);
  const [despeckle, setDespeckle] = useState<boolean>(true);
  const [enforceSymmetry, setEnforceSymmetry] = useState<'none' | 'horizontal' | 'vertical'>('none');
  const [forceSeamless, setForceSeamless] = useState<boolean>(true);
  const [invert, setInvert] = useState<boolean>(false);

  // Crop Region of Interest (ROI) State
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: 1, height: 1 });
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);

  // In-modal touch-up editing
  const [touchUpTool, setTouchUpTool] = useState<'view' | 'brush' | 'eraser'>('view');
  const [activeTouchUpStitch, setActiveTouchUpStitch] = useState<number>(1);
  const [manualGrid, setManualGrid] = useState<number[][] | null>(null);

  // Result state
  const [tracedResult, setTracedResult] = useState<TracedResult | null>(null);

  // Canvas refs
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cylinderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sample Presets
  const samplePresets = [
    {
      name: 'Geometric 7-Chevron',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="192" viewBox="0 0 120 192"><rect width="120" height="192" fill="%23ffffff"/><polygon points="60,20 100,80 80,80 60,50 40,80 20,80" fill="%23d4af37"/><polygon points="60,65 95,120 80,120 60,90 40,120 25,120" fill="%23781d22"/><polygon points="60,110 90,160 75,160 60,135 45,160 30,160" fill="%23d4af37"/><rect x="0" y="0" width="120" height="10" fill="%23d4af37"/><rect x="0" y="182" width="120" height="10" fill="%23d4af37"/></svg>',
    },
    {
      name: 'Kasab Starburst',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="192" viewBox="0 0 120 192"><rect width="120" height="192" fill="%23ffffff"/><polygon points="60,30 70,75 110,60 80,95 110,130 70,115 60,160 50,115 10,130 40,95 10,60 50,75" fill="%23d4af37"/><circle cx="60" cy="95" r="16" fill="%23781d22"/><circle cx="60" cy="95" r="7" fill="%23d4af37"/><line x1="0" y1="8" x2="120" y2="8" stroke="%23d4af37" stroke-width="8"/><line x1="0" y1="184" x2="120" y2="184" stroke="%23d4af37" stroke-width="8"/></svg>',
    },
    {
      name: 'Diamond Jali Lattice',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="192" viewBox="0 0 120 192"><rect width="120" height="192" fill="%23ffffff"/><polygon points="60,30 100,95 60,160 20,95" fill="%23ffffff" stroke="%23d4af37" stroke-width="8"/><circle cx="60" cy="95" r="14" fill="%231b4d3e"/><rect x="40" y="75" width="40" height="40" fill="none" stroke="%237dd3fc" stroke-width="4" stroke-dasharray="6,4"/><line x1="0" y1="6" x2="120" y2="6" stroke="%23d4af37" stroke-width="6"/><line x1="0" y1="186" x2="120" y2="186" stroke="%23d4af37" stroke-width="6"/></svg>',
    },
    {
      name: 'Floral Paisley Leaf',
      url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="192" viewBox="0 0 120 192"><rect width="120" height="192" fill="%23ffffff"/><path d="M60,30 C90,60 100,120 60,155 C20,120 30,60 60,30 Z" fill="%23d4af37"/><path d="M60,55 C78,78 85,115 60,135 C35,115 42,78 60,55 Z" fill="%231b4d3e"/><circle cx="60" cy="100" r="10" fill="%23781d22"/><line x1="0" y1="6" x2="120" y2="6" stroke="%23d4af37" stroke-width="6"/><line x1="0" y1="186" x2="120" y2="186" stroke="%23d4af37" stroke-width="6"/></svg>',
    },
  ];

  // Load image
  useEffect(() => {
    if (!imageSrc) {
      setImageSrc(samplePresets[0].url);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setManualGrid(null); // Reset manual overrides on new image
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Execute trace
  const runTrace = useCallback(() => {
    if (!imageElement) return;

    const cols = traceMode === 'motif' ? targetCols : targetCols * totalRepeats;

    const options: TraceOptions = {
      targetRows,
      targetCols: cols,
      algorithm,
      brightness,
      contrast,
      threshold,
      kasabSensitivity,
      despeckle,
      enforceSymmetry,
      forceSeamlessEdges: forceSeamless,
      invert,
      edgeThickness: 1,
      crop: crop.width > 0.05 && crop.height > 0.05 ? crop : undefined,
    };

    const res = traceImageToGrid(imageElement, palette, options);
    setTracedResult(res);
    setManualGrid(null);
  }, [
    imageElement,
    palette,
    targetRows,
    targetCols,
    traceMode,
    totalRepeats,
    algorithm,
    brightness,
    contrast,
    threshold,
    kasabSensitivity,
    despeckle,
    enforceSymmetry,
    forceSeamless,
    invert,
    crop,
  ]);

  useEffect(() => {
    runTrace();
  }, [runTrace]);

  const activeGrid = manualGrid || tracedResult?.grid || [];

  // Draw Cropping Canvas
  useEffect(() => {
    if (!imageElement || !cropCanvasRef.current) return;
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 240;
    canvas.height = 180;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    // Draw Crop Bounding Box Overlay
    if (crop.width < 1 || crop.height < 1 || isCropping) {
      const rx = crop.x * canvas.width;
      const ry = crop.y * canvas.height;
      const rw = crop.width * canvas.width;
      const rh = crop.height * canvas.height;

      // Darken outside
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear inside
      ctx.clearRect(rx, ry, rw, rh);
      ctx.drawImage(
        imageElement,
        (rx / canvas.width) * imageElement.naturalWidth,
        (ry / canvas.height) * imageElement.naturalHeight,
        (rw / canvas.width) * imageElement.naturalWidth,
        (rh / canvas.height) * imageElement.naturalHeight,
        rx,
        ry,
        rw,
        rh
      );

      // Gold border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, rw, rh);
    }
  }, [imageElement, crop, isCropping]);

  // Draw 2D Traced Stitch Matrix
  useEffect(() => {
    if (!previewCanvasRef.current || !activeGrid.length) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rows = activeGrid.length;
    const cols = activeGrid[0]?.length || 0;
    const cellSize = Math.max(6, Math.min(22, Math.floor(260 / Math.max(rows, cols))));

    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const st = activeGrid[r][c];
        const hex = palette[st]?.hex || '#FFFFFF';
        ctx.fillStyle = hex;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);

        // Special render for Jali
        if (st === 3) {
          ctx.strokeStyle = '#0284C7';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(c * cellSize, r * cellSize);
          ctx.lineTo((c + 1) * cellSize, (r + 1) * cellSize);
          ctx.stroke();
        }

        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }, [activeGrid, palette]);

  // Draw 3D Rotating Topi Simulation
  useEffect(() => {
    if (!cylinderCanvasRef.current || !activeGrid.length) return;
    const canvas = cylinderCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let fullGrid: number[][];
    if (traceMode === 'motif') {
      fullGrid = tileMotifMatrix(activeGrid, totalRepeats);
    } else {
      fullGrid = activeGrid;
    }

    const rows = fullGrid.length;
    const cols = fullGrid[0]?.length || 1;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2 + 5;
    const radiusX = Math.min(width * 0.36, 120);
    const radiusY = radiusX * 0.28;
    const cylinderH = Math.min(height * 0.5, 95);
    const topY = centerY - cylinderH / 2;
    const bottomY = centerY + cylinderH / 2;

    // Dome Cap
    const grad = ctx.createRadialGradient(centerX, topY - 5, 5, centerX, topY, radiusX);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#E6DFCE');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(centerX, topY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Side Wall segments
    const numSegs = 70;
    const rowH = cylinderH / rows;

    for (let seg = 0; seg < numSegs; seg++) {
      const theta = (seg / numSegs) * Math.PI;
      const angle = theta + 0.3;

      const x1 = centerX + radiusX * Math.cos(angle);
      const x2 = centerX + radiusX * Math.cos(angle + Math.PI / numSegs);

      const normAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const col = Math.floor((normAngle / (Math.PI * 2)) * cols) % cols;
      const shadow = 0.5 + 0.5 * Math.sin(theta);

      for (let r = 0; r < rows; r++) {
        const st = fullGrid[r]?.[col] ?? 0;
        const hex = palette[st]?.hex || '#FFFFFF';
        ctx.fillStyle = shadeColor(hex, shadow);
        const yTop = topY + r * rowH + radiusY * Math.sin(angle);
        ctx.fillRect(x1, yTop, Math.max(1, x2 - x1 + 0.5), rowH + 0.5);
      }
    }

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, bottomY, radiusX, radiusY, 0, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(centerX, topY, radiusX, radiusY, 0, 0, Math.PI);
    ctx.stroke();
  }, [activeGrid, palette, traceMode, totalRepeats]);

  // Crop Drag Handler
  const handleCropMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = cropCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvas.width;
    const y = (e.clientY - rect.top) / canvas.height;
    setIsCropping(true);
    setCropStart({ x, y });
    setCrop({ x, y, width: 0.05, height: 0.05 });
  };

  const handleCropMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isCropping || !cropStart || !cropCanvasRef.current) return;
    const canvas = cropCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const curX = Math.max(0, Math.min(1, (e.clientX - rect.left) / canvas.width));
    const curY = Math.max(0, Math.min(1, (e.clientY - rect.top) / canvas.height));

    const minX = Math.min(cropStart.x, curX);
    const minY = Math.min(cropStart.y, curY);
    const w = Math.abs(curX - cropStart.x);
    const h = Math.abs(curY - cropStart.y);

    setCrop({ x: minX, y: minY, width: w, height: h });
  };

  const handleCropMouseUp = () => {
    setIsCropping(false);
    setCropStart(null);
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
  };

  // In-modal touch-up on traced canvas
  const handleTouchUpClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (touchUpTool === 'view' || !previewCanvasRef.current || !activeGrid.length) return;
    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const rows = activeGrid.length;
    const cols = activeGrid[0]?.length || 1;
    const cellSize = canvas.width / cols;

    const c = Math.floor((e.clientX - rect.left) / cellSize);
    const r = Math.floor((e.clientY - rect.top) / cellSize);

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      const nextVal = touchUpTool === 'eraser' ? 0 : activeTouchUpStitch;
      const updated = activeGrid.map((row) => [...row]);
      updated[r][c] = nextVal;
      setManualGrid(updated);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target?.result as string);
      resetCrop();
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (!activeGrid.length) return;

    let finalGrid = activeGrid;
    if (traceMode === 'motif') {
      finalGrid = tileMotifMatrix(activeGrid, totalRepeats);
    }

    onApplyTracedGrid({
      grid: finalGrid,
      motifWidth: targetCols,
      mode: traceMode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-3 md:p-5">
      <div className="bg-white rounded-2xl border border-bohra-border shadow-2xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-fadeIn text-bohra-text">
        {/* Modal Header */}
        <div className="p-4 border-b border-bohra-border bg-bohra-paper/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-gold-400 to-gold-600 text-white rounded-xl shadow-sm">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-bohra-text flex items-center gap-2">
                <span>Topi Vector & Grid Tracing Studio</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gold-100 text-gold-800 border border-gold-300">
                  Enhanced Multi-Engine
                </span>
              </h3>
              <p className="text-xs text-bohra-muted">
                Logically convert sketches, photos, and motifs into authentic Bohra Topi stitch patterns.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white hover:bg-gold-50 border border-bohra-border rounded-lg text-bohra-text transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-gold-600" />
              <span>Upload Custom Image</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.svg"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={onClose}
              className="p-1.5 text-bohra-muted hover:text-bohra-text rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Workspace */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 bg-bohra-paper/20">
          {/* Left Panel: Algorithm & Artisan Tuning (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4 bg-white p-4 rounded-xl border border-bohra-border shadow-sm text-xs">
            {/* 1. Tracing Engine Algorithm Tabs */}
            <div>
              <span className="font-bold text-bohra-text text-xs uppercase tracking-wider block mb-1.5">
                1. Tracing Algorithm:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'adaptive', label: 'Adaptive Color', desc: 'Full-color clustering' },
                  { id: 'contour', label: 'Kasab Outlines', desc: 'Sobel edge contours' },
                  { id: 'silhouette', label: 'Silhouette / Stamp', desc: 'Binary contrast' },
                  { id: 'jali_mesh', label: 'Jali Open Lace', desc: 'Mesh pattern recognizer' },
                ].map((algo) => (
                  <button
                    key={algo.id}
                    onClick={() => setAlgorithm(algo.id as TracingAlgorithm)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      algorithm === algo.id
                        ? 'border-gold-500 bg-gold-50/70 shadow-sm ring-1 ring-gold-200'
                        : 'border-bohra-border bg-bohra-paper/40 hover:bg-white'
                    }`}
                  >
                    <div className="font-bold text-[11px] text-bohra-text">{algo.label}</div>
                    <div className="text-[9px] text-bohra-muted truncate">{algo.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Sample Presets */}
            <div>
              <span className="font-bold text-bohra-muted text-[11px] uppercase tracking-wider block mb-1">
                Preset Motifs:
              </span>
              <div className="flex flex-wrap gap-1">
                {samplePresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setImageSrc(preset.url);
                      resetCrop();
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-bohra-paper hover:bg-gold-50 border border-bohra-border text-bohra-text transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Scope & Dimensions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-bohra-border">
              <div>
                <label className="text-[11px] font-semibold text-bohra-text block mb-1">
                  Scope
                </label>
                <select
                  value={traceMode}
                  onChange={(e) => setTraceMode(e.target.value as 'motif' | 'full')}
                  className="w-full text-xs font-semibold px-2 py-1 border border-bohra-border rounded bg-bohra-paper/50"
                >
                  <option value="motif">Single Motif (Tiled)</option>
                  <option value="full">Full Kinar Wall</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-bohra-text block mb-1">
                  {traceMode === 'motif' ? 'Motif Width' : 'Total Cols'}
                </label>
                <input
                  type="number"
                  min="6"
                  max="60"
                  value={targetCols}
                  onChange={(e) => setTargetCols(parseInt(e.target.value) || 15)}
                  className="w-full font-mono text-center font-bold px-2 py-1 border border-bohra-border rounded bg-bohra-paper/50"
                />
              </div>
            </div>

            {/* 4. Fine-Tuning Sliders */}
            <div className="space-y-2.5 pt-2 border-t border-bohra-border">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3 text-gold-600" /> Kasab Sensitivity
                  </span>
                  <span className="font-mono text-bohra-muted">{kasabSensitivity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={kasabSensitivity}
                  onChange={(e) => setKasabSensitivity(parseInt(e.target.value))}
                  className="w-full accent-gold-600 h-1.5"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold flex items-center gap-1">
                    <Contrast className="w-3 h-3 text-gold-600" /> Contrast Boost
                  </span>
                  <span className="font-mono text-bohra-muted">{contrast}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="100"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full accent-gold-600 h-1.5"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold flex items-center gap-1">
                    <Sun className="w-3 h-3 text-gold-600" /> Brightness
                  </span>
                  <span className="font-mono text-bohra-muted">{brightness}</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full accent-gold-600 h-1.5"
                />
              </div>
            </div>

            {/* 5. Artisan Filters */}
            <div className="space-y-1.5 pt-2 border-t border-bohra-border text-[11px]">
              <span className="font-bold text-bohra-text block mb-1">Artisan Cleaners:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={despeckle}
                  onChange={(e) => setDespeckle(e.target.checked)}
                  className="rounded border-bohra-border text-gold-600"
                />
                <span><strong>Despeckle:</strong> Auto-remove 1-pixel noisy speckles</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceSeamless}
                  onChange={(e) => setForceSeamless(e.target.checked)}
                  className="rounded border-bohra-border text-gold-600"
                />
                <span><strong>Seamless:</strong> Smooth left/right repeat boundaries</span>
              </label>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-medium text-bohra-text">Bilateral Symmetry:</span>
                <select
                  value={enforceSymmetry}
                  onChange={(e) => setEnforceSymmetry(e.target.value as any)}
                  className="text-[10px] px-2 py-0.5 border border-bohra-border rounded bg-bohra-paper"
                >
                  <option value="none">None</option>
                  <option value="horizontal">Mirror Left ↔ Right</option>
                  <option value="vertical">Mirror Top ↕ Bottom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive Visual Studio (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {/* Top Row: Crop ROI Box & Traced Stitch Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Box 1: Crop & Source Image */}
              <div className="bg-white rounded-xl border border-bohra-border p-3.5 flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-bohra-text uppercase flex items-center gap-1.5">
                    <Crop className="w-3.5 h-3.5 text-gold-600" />
                    Crop / ROI Selector
                  </span>
                  {(crop.width < 1 || crop.height < 1) && (
                    <button
                      onClick={resetCrop}
                      className="text-[10px] text-gold-700 hover:underline"
                    >
                      Reset Full Image
                    </button>
                  )}
                </div>

                <div className="relative flex-1 bg-bohra-paper/40 rounded-lg border border-bohra-border flex items-center justify-center p-2 min-h-[180px] select-none cursor-crosshair">
                  <canvas
                    ref={cropCanvasRef}
                    onMouseDown={handleCropMouseDown}
                    onMouseMove={handleCropMouseMove}
                    onMouseUp={handleCropMouseUp}
                    className="max-h-[160px] rounded shadow-inner"
                  />
                </div>
                <div className="text-[10px] text-bohra-muted text-center mt-1.5">
                  Drag on image to select motif crop area
                </div>
              </div>

              {/* Box 2: Traced Grid & In-Modal Touch-up */}
              <div className="bg-white rounded-xl border border-bohra-border p-3.5 flex flex-col shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-bohra-text uppercase flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-gold-600" />
                    Traced Grid ({targetRows}R × {activeGrid[0]?.length || targetCols}C)
                  </span>

                  {/* Touch-up tool selector */}
                  <div className="flex items-center bg-bohra-paper rounded-lg border border-bohra-border p-0.5 text-xs">
                    <button
                      onClick={() => setTouchUpTool('brush')}
                      className={`p-1 rounded ${touchUpTool === 'brush' ? 'bg-gold-500 text-white' : 'text-bohra-muted'}`}
                      title="Brush stitch touch-up"
                    >
                      <Paintbrush className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setTouchUpTool('eraser')}
                      className={`p-1 rounded ${touchUpTool === 'eraser' ? 'bg-gold-500 text-white' : 'text-bohra-muted'}`}
                      title="Erase stitch to White Base"
                    >
                      <Eraser className="w-3 h-3" />
                    </button>
                    {manualGrid && (
                      <button
                        onClick={() => setManualGrid(null)}
                        className="p-1 text-bohra-muted hover:text-rose-600"
                        title="Reset manual touch-ups"
                      >
                        <Undo2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative flex-1 bg-bohra-paper/40 rounded-lg border border-bohra-border flex items-center justify-center p-2 min-h-[180px] overflow-auto select-none">
                  <canvas
                    ref={previewCanvasRef}
                    onClick={handleTouchUpClick}
                    className="rounded shadow-sm cursor-pointer"
                  />
                </div>
                <div className="text-[10px] text-bohra-muted text-center mt-1.5">
                  {touchUpTool !== 'view'
                    ? `Click cells to paint Stitch #${activeTouchUpStitch}`
                    : 'Pixel-perfect stitch quantization'}
                </div>
              </div>
            </div>

            {/* Bottom Row: 3D Cylindrical Topi Simulation & Color Breakdown */}
            <div className="bg-white rounded-xl border border-bohra-border p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-bohra-text uppercase flex items-center gap-1.5">
                  <Cylinder className="w-4 h-4 text-gold-600" />
                  3D Continuous Cylindrical Wall Simulation
                </span>
                <span className="text-[11px] text-bohra-muted font-mono">
                  {traceMode === 'motif' ? `${totalRepeats} Repeats Tiled` : 'Full Cylinder'}
                </span>
              </div>

              <div className="relative w-full h-[170px] bg-gradient-to-b from-bohra-paper to-bohra-cream rounded-xl border border-bohra-border flex items-center justify-center overflow-hidden">
                <canvas ref={cylinderCanvasRef} width={420} height={170} />
              </div>

              {/* Color breakdown badges */}
              {tracedResult && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-bohra-border">
                  <div className="flex flex-wrap gap-1.5">
                    {tracedResult.detectedClusters.map((cluster) => {
                      const colorItem = palette[cluster.mappedStitchId];
                      return (
                        <div
                          key={cluster.mappedStitchId}
                          className="flex items-center gap-1.5 bg-bohra-paper px-2 py-0.5 rounded border border-bohra-border text-[11px]"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full border border-black/10"
                            style={{ backgroundColor: colorItem?.hex || '#FFF' }}
                          />
                          <span className="font-semibold text-bohra-text">
                            {colorItem?.name || `Stitch #${cluster.mappedStitchId}`}:
                          </span>
                          <span className="font-mono text-bohra-muted">{cluster.count} sts</span>
                        </div>
                      );
                    })}
                  </div>

                  <span className="text-[11px] text-emerald-700 font-bold">
                    ✓ Clean Stitch Alignment ({targetRows * (traceMode === 'motif' ? targetCols * totalRepeats : targetCols)} Total Sts)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-bohra-border bg-bohra-paper/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-bohra-muted hover:text-bohra-text transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={runTrace}
              className="flex items-center gap-1 text-xs px-3 py-2 bg-white hover:bg-gold-50 border border-bohra-border rounded-xl text-bohra-text transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gold-600" />
              <span>Re-Run Trace</span>
            </button>

            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-6 py-2 text-xs font-bold text-white bg-gold-600 hover:bg-gold-700 active:bg-gold-800 rounded-xl shadow-md transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Apply Traced Pattern to Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function shadeColor(hex: string, factor: number): string {
  if (!hex || !hex.startsWith('#')) return hex;
  const cleanHex = hex.replace('#', '');
  const r = Math.min(255, Math.floor(parseInt(cleanHex.substring(0, 2), 16) * factor));
  const g = Math.min(255, Math.floor(parseInt(cleanHex.substring(2, 4), 16) * factor));
  const b = Math.min(255, Math.floor(parseInt(cleanHex.substring(4, 6), 16) * factor));
  return `rgb(${r}, ${g}, ${b})`;
}
