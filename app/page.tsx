'use client';

import React, { useState, useEffect } from 'react';
import { Pattern, CrownRound, ColorPalette } from '@/lib/types';
import { seedPatterns } from '@/lib/seeds';
import { scalePatternWidth, tileMotifMatrix } from '@/lib/scaling';
import { generateFlatCrown } from '@/lib/validator';
import { Navbar } from '@/components/Navbar';
import { PalettePicker } from '@/components/PalettePicker';
import { KinarCanvasEditor } from '@/components/KinarCanvasEditor';
import { TilingPreview } from '@/components/TilingPreview';
import { CrownDesigner } from '@/components/CrownDesigner';
import { SizeScalingModal } from '@/components/SizeScalingModal';
import { PrintExportModal } from '@/components/PrintExportModal';
import { PatternVaultModal } from '@/components/PatternVaultModal';
import { CraftGuideModal } from '@/components/CraftGuideModal';
import { ImageTracerModal } from '@/components/ImageTracerModal';
import {
  Layers,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  Maximize2,
  Grid,
  FileCode,
  Info,
  Wand2,
  Upload,
} from 'lucide-react';

export default function TopiStudioPage() {
  const [currentPattern, setCurrentPattern] = useState<Pattern>(seedPatterns[0]);
  const [activeStitchId, setActiveStitchId] = useState<number>(1); // Default to Kasab Gold
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Edit Mode: 'full' (all columns) vs 'motif' (single repeat column slice)
  const [editMode, setEditMode] = useState<'full' | 'motif'>('full');
  const [motifWidth, setMotifWidth] = useState<number>(15);

  // Modals state
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isScalingOpen, setIsScalingOpen] = useState<boolean>(false);
  const [isCrownOpen, setIsCrownOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isTracerOpen, setIsTracerOpen] = useState<boolean>(false);

  // Initial load from backend API
  useEffect(() => {
    async function loadInitialPattern() {
      try {
        const res = await fetch('/api/patterns');
        const data = await res.json();
        if (data.patterns && data.patterns.length > 0) {
          setCurrentPattern(data.patterns[0]);
        }
      } catch (err) {
        console.warn('Using default seed pattern:', err);
      }
    }
    loadInitialPattern();
  }, []);

  // Compute repeats from total columns & motif width
  const totalCols = currentPattern.kinar_grid[0]?.length || 210;
  const computedRepeats = Math.max(1, Math.round(totalCols / motifWidth));

  // Extract single motif grid from full grid
  const getSingleMotifGrid = (): number[][] => {
    return currentPattern.kinar_grid.map((row) =>
      row.slice(0, Math.min(motifWidth, row.length))
    );
  };

  // When editing in motif mode vs full mode
  const handleGridChange = (newGrid: number[][]) => {
    if (editMode === 'motif') {
      // Re-tile new motif across all repeats
      const tiled = tileMotifMatrix(newGrid, computedRepeats);
      setCurrentPattern((prev) => ({
        ...prev,
        kinar_grid: tiled,
      }));
    } else {
      setCurrentPattern((prev) => ({
        ...prev,
        kinar_grid: newGrid,
      }));
    }
  };

  const handleSelectStitch = (id: number) => {
    setActiveStitchId(id);
  };

  const handleUpdatePalette = (newPalette: ColorPalette) => {
    setCurrentPattern((prev) => ({
      ...prev,
      color_palette: newPalette,
    }));
  };

  const handleUpdateCrown = (newRounds: CrownRound[]) => {
    setCurrentPattern((prev) => ({
      ...prev,
      crown_grid: newRounds,
    }));
  };

  // Save active pattern to SQLite / Turso
  const handleSavePattern = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPattern),
      });
      if (res.ok) {
        setSaveMessage('Pattern successfully saved to Turso Vault!');
        setTimeout(() => setSaveMessage(null), 3500);
      } else {
        setSaveMessage('Failed to save pattern.');
      }
    } catch (err) {
      setSaveMessage('Error saving pattern.');
    } finally {
      setIsSaving(false);
    }
  };

  // Create new blank pattern
  const handleNewPattern = () => {
    const rows = 24;
    const baseMotifW = 15;
    const repeats = 14;
    const cols = baseMotifW * repeats;

    const blankGrid = Array(rows)
      .fill(0)
      .map(() => Array(cols).fill(0));

    // Add top/bottom Kasab border lines
    for (let c = 0; c < cols; c++) {
      blankGrid[0][c] = 1;
      blankGrid[rows - 1][c] = 1;
    }

    const newPat: Pattern = {
      id: `topi-${Date.now()}`,
      title: 'New Custom Topi Motif',
      description: 'Handcrafted custom Bohra Topi design created in Topi Studio.',
      difficulty_level: 'intermediate',
      head_size_inches: 21.0,
      gauge_sts_per_inch: 10.0,
      crown_grid: generateFlatCrown(cols, 6),
      kinar_grid: blankGrid,
      color_palette: {
        '0': { name: 'White Cotton', hex: '#FAF8F5', symbol: 'sc' },
        '1': { name: 'Kasab Gold', hex: '#D4AF37', symbol: 'kg' },
        '2': { name: 'Silk Accent', hex: '#781D22', symbol: 'sm' },
        '3': { name: 'Jali Open', hex: '#7DD3FC', symbol: 'ch' },
      },
    };

    setCurrentPattern(newPat);
  };

  // Apply scaling result from SizeScalingModal
  const handleApplyScaling = (result: {
    headSize: number;
    gauge: number;
    repeats: number;
    totalColumns: number;
    newGrid?: number[][];
  }) => {
    setCurrentPattern((prev) => ({
      ...prev,
      head_size_inches: result.headSize,
      gauge_sts_per_inch: result.gauge,
      kinar_grid: result.newGrid || prev.kinar_grid,
      crown_grid: generateFlatCrown(result.totalColumns, 6),
    }));
  };

  // Handle Traced Grid application
  const handleApplyTracedGrid = (result: {
    grid: number[][];
    motifWidth: number;
    mode: 'motif' | 'full';
  }) => {
    setMotifWidth(result.motifWidth);
    setCurrentPattern((prev) => ({
      ...prev,
      title: `${prev.title} (Traced Design)`,
      kinar_grid: result.grid,
      crown_grid: generateFlatCrown(result.grid[0]?.length || 210, 6),
    }));
    setSaveMessage('Image design traced & applied to Topi pattern!');
    setTimeout(() => setSaveMessage(null), 3500);
  };

  const activeDisplayGrid =
    editMode === 'motif' ? getSingleMotifGrid() : currentPattern.kinar_grid;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2C2824]">
      {/* Top Navigation */}
      <Navbar
        currentPattern={currentPattern}
        isSaving={isSaving}
        onSave={handleSavePattern}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenScaling={() => setIsScalingOpen(true)}
        onOpenCrown={() => setIsCrownOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenTracer={() => setIsTracerOpen(true)}
        onNewPattern={handleNewPattern}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Save Notification Toast */}
      {saveMessage && (
        <div className="fixed top-16 right-6 z-50 bg-gold-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Main Studio Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Pattern Metadata & Mode Bar */}
        <div className="bg-white rounded-xl border border-bohra-border p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentPattern.title}
                onChange={(e) =>
                  setCurrentPattern({ ...currentPattern, title: e.target.value })
                }
                className="font-serif font-bold text-lg text-bohra-text border-b border-transparent hover:border-bohra-border focus:border-gold-500 focus:outline-none bg-transparent"
              />
            </div>
            <input
              type="text"
              value={currentPattern.description}
              onChange={(e) =>
                setCurrentPattern({ ...currentPattern, description: e.target.value })
              }
              placeholder="Add description..."
              className="text-xs text-bohra-muted w-full border-b border-transparent hover:border-bohra-border focus:border-gold-500 focus:outline-none bg-transparent mt-0.5"
            />
          </div>

          {/* Grid Editing Mode Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsTracerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gold-800 bg-gold-50 hover:bg-gold-100 border border-gold-300 rounded-lg transition-colors shadow-sm"
              title="Upload an image to auto-trace into stitches"
            >
              <Wand2 className="w-3.5 h-3.5 text-gold-700" />
              <span>Trace Image</span>
            </button>

            <div className="flex items-center bg-bohra-paper rounded-lg border border-bohra-border p-0.5 text-xs">
              <button
                onClick={() => setEditMode('full')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  editMode === 'full'
                    ? 'bg-gold-500 text-white font-bold shadow-sm'
                    : 'text-bohra-text hover:bg-white'
                }`}
                title="Edit full cylindrical matrix (e.g. 24x210 stitches)"
              >
                Full Grid ({totalCols} cols)
              </button>
              <button
                onClick={() => setEditMode('motif')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  editMode === 'motif'
                    ? 'bg-gold-500 text-white font-bold shadow-sm'
                    : 'text-bohra-text hover:bg-white'
                }`}
                title="Edit single base motif (auto-tiles to full circumference)"
              >
                Single Motif ({motifWidth} cols)
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-bohra-muted font-mono bg-bohra-paper px-2.5 py-1.5 rounded-lg border border-bohra-border">
              <span>Motif Width:</span>
              <input
                type="number"
                min="2"
                max="60"
                value={motifWidth}
                onChange={(e) => setMotifWidth(Math.max(2, parseInt(e.target.value) || 15))}
                className="w-10 text-center font-bold text-bohra-text bg-white border border-bohra-border rounded"
              />
              <span>sts</span>
            </div>
          </div>
        </div>

        {/* Color Palette & Thread Selector */}
        <PalettePicker
          palette={currentPattern.color_palette}
          activeStitchId={activeStitchId}
          kinarGrid={currentPattern.kinar_grid}
          onSelectStitch={handleSelectStitch}
          onUpdatePalette={handleUpdatePalette}
        />

        {/* Studio Grid & Simulation Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Cols: Interactive Canvas Grid Editor */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <KinarCanvasEditor
              grid={activeDisplayGrid}
              palette={currentPattern.color_palette}
              activeStitchId={activeStitchId}
              onGridChange={handleGridChange}
              onSelectStitch={handleSelectStitch}
              motifWidth={motifWidth}
            />
          </div>

          {/* Right Col: 3D Simulation & Quick Crown Card */}
          <div className="flex flex-col gap-6">
            {/* Live 3D Bohra Topi Cylindrical Wall Simulation */}
            <TilingPreview
              grid={currentPattern.kinar_grid}
              palette={currentPattern.color_palette}
              repeats={computedRepeats}
              motifWidth={motifWidth}
            />

            {/* Quick Chhat (Crown) Status Card */}
            <div className="bg-white rounded-xl border border-bohra-border p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-bohra-text">
                    Crown (Chhat) Status
                  </h3>
                </div>
                <button
                  onClick={() => setIsCrownOpen(true)}
                  className="text-xs font-semibold text-gold-700 hover:text-gold-800 bg-gold-50 px-2.5 py-1 rounded-lg border border-gold-200 transition-colors"
                >
                  Open Chhat Designer
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-bohra-paper/60 p-3 rounded-lg border border-bohra-border text-center text-xs">
                <div>
                  <span className="text-[10px] text-bohra-muted block">Rounds</span>
                  <span className="font-bold text-bohra-text">{currentPattern.crown_grid.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-bohra-muted block">Expansion</span>
                  <span className="font-bold text-emerald-700">+6 / rnd</span>
                </div>
                <div>
                  <span className="text-[10px] text-bohra-muted block">Total Sts</span>
                  <span className="font-bold text-gold-700 font-mono">
                    {currentPattern.crown_grid.reduce((a, b) => a + b.stitches, 0)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-bohra-muted leading-relaxed">
                The Chhat is worked in continuous concentric spiral rounds to guarantee a flat disk.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      {isTracerOpen && (
        <ImageTracerModal
          palette={currentPattern.color_palette}
          currentRows={currentPattern.kinar_grid.length}
          currentMotifWidth={motifWidth}
          totalRepeats={computedRepeats}
          onApplyTracedGrid={handleApplyTracedGrid}
          onClose={() => setIsTracerOpen(false)}
        />
      )}

      {isVaultOpen && (
        <PatternVaultModal
          currentPatternId={currentPattern.id}
          onSelectPattern={(pat) => setCurrentPattern(pat)}
          onNewPattern={handleNewPattern}
          onClose={() => setIsVaultOpen(false)}
        />
      )}

      {isScalingOpen && (
        <SizeScalingModal
          currentHeadSize={currentPattern.head_size_inches}
          currentGauge={currentPattern.gauge_sts_per_inch}
          motifWidth={motifWidth}
          motifGrid={currentPattern.kinar_grid}
          onApplyScaling={handleApplyScaling}
          onClose={() => setIsScalingOpen(false)}
        />
      )}

      {isCrownOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <CrownDesigner
            rounds={currentPattern.crown_grid}
            headSizeInches={currentPattern.head_size_inches}
            gauge={currentPattern.gauge_sts_per_inch}
            onUpdateRounds={handleUpdateCrown}
            onClose={() => setIsCrownOpen(false)}
          />
        </div>
      )}

      {isExportOpen && (
        <PrintExportModal
          pattern={currentPattern}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {isGuideOpen && (
        <CraftGuideModal onClose={() => setIsGuideOpen(false)} />
      )}
    </div>
  );
}
