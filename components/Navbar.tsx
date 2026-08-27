'use client';

import React from 'react';
import { Pattern } from '@/lib/types';
import { 
  FolderOpen, 
  Ruler, 
  CircleDot, 
  Printer, 
  Save, 
  Plus, 
  Sparkles,
  Layers,
  HelpCircle,
  Wand2,
} from 'lucide-react';

interface NavbarProps {
  currentPattern: Pattern;
  isSaving: boolean;
  onSave: () => void;
  onOpenVault: () => void;
  onOpenScaling: () => void;
  onOpenCrown: () => void;
  onOpenExport: () => void;
  onOpenTracer: () => void;
  onNewPattern: () => void;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPattern,
  isSaving,
  onSave,
  onOpenVault,
  onOpenScaling,
  onOpenCrown,
  onOpenExport,
  onOpenTracer,
  onNewPattern,
  onOpenGuide,
}) => {
  const difficultyColors = {
    beginner: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    intermediate: 'bg-amber-100 text-amber-800 border-amber-300',
    advanced: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  const rows = currentPattern.kinar_grid.length;
  const cols = currentPattern.kinar_grid[0]?.length || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-bohra-border px-4 py-2.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Pattern Title */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 text-white shadow-inner font-serif font-bold text-xl ring-2 ring-gold-200">
            ط
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-bohra-text tracking-tight flex items-center gap-1.5">
                {currentPattern.title}
              </h1>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  difficultyColors[currentPattern.difficulty_level] || difficultyColors.intermediate
                }`}
              >
                {currentPattern.difficulty_level}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-bohra-muted">
              <span>{currentPattern.head_size_inches}&quot; Circumference</span>
              <span>•</span>
              <span>{currentPattern.gauge_sts_per_inch} sts/in</span>
              <span>•</span>
              <span className="font-mono bg-bohra-paper px-1.5 py-0.2 rounded text-[11px]">
                {rows}R × {cols}C ({rows * cols} sts)
              </span>
            </div>
          </div>
        </div>

        {/* Center: Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onOpenTracer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gold-800 bg-gold-100 hover:bg-gold-200 border border-gold-300 rounded-lg transition-colors shadow-sm animate-pulse hover:animate-none"
            title="Auto-Trace Design Image to Stitch Grid"
          >
            <Wand2 className="w-3.5 h-3.5 text-gold-700" />
            <span>Trace Image</span>
          </button>

          <button
            onClick={onOpenVault}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-bohra-text bg-bohra-paper hover:bg-gold-50 border border-bohra-border rounded-lg transition-colors shadow-sm"
            title="Browse & Search Pattern Vault (FTS5)"
          >
            <FolderOpen className="w-3.5 h-3.5 text-gold-600" />
            <span>Vault</span>
          </button>

          <button
            onClick={onNewPattern}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-bohra-text bg-bohra-paper hover:bg-gold-50 border border-bohra-border rounded-lg transition-colors shadow-sm"
            title="Create New Pattern"
          >
            <Plus className="w-3.5 h-3.5 text-gold-600" />
            <span>New</span>
          </button>

          <button
            onClick={onOpenScaling}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-bohra-text bg-bohra-paper hover:bg-gold-50 border border-bohra-border rounded-lg transition-colors shadow-sm"
            title="Size Scaling Engine"
          >
            <Ruler className="w-3.5 h-3.5 text-gold-600" />
            <span>Scale Width</span>
          </button>

          <button
            onClick={onOpenCrown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-bohra-text bg-bohra-paper hover:bg-gold-50 border border-bohra-border rounded-lg transition-colors shadow-sm"
            title="Crown (Chhat) Designer & Validator"
          >
            <CircleDot className="w-3.5 h-3.5 text-gold-600" />
            <span>Chhat Designer</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-bohra-text bg-bohra-paper hover:bg-gold-50 border border-bohra-border rounded-lg transition-colors shadow-sm"
            title="Print & PDF Export"
          >
            <Printer className="w-3.5 h-3.5 text-gold-600" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="p-1.5 text-bohra-muted hover:text-bohra-text hover:bg-bohra-paper rounded-lg transition-colors"
            title="Bohra Topi Craft Guide & Stitch Key"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-gold-600 hover:bg-gold-700 active:bg-gold-800 disabled:opacity-50 rounded-lg shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Vault'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
