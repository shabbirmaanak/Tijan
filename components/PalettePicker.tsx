'use client';

import React, { useState } from 'react';
import { ColorPalette } from '@/lib/types';
import { calculateThreadUsage } from '@/lib/compiler';
import { Plus, Edit2, Check, Sparkles, PieChart } from 'lucide-react';

interface PalettePickerProps {
  palette: ColorPalette;
  activeStitchId: number;
  kinarGrid: number[][];
  onSelectStitch: (id: number) => void;
  onUpdatePalette: (newPalette: ColorPalette) => void;
}

export const PalettePicker: React.FC<PalettePickerProps> = ({
  palette,
  activeStitchId,
  kinarGrid,
  onSelectStitch,
  onUpdatePalette,
}) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editHex, setEditHex] = useState('');
  const [showStats, setShowStats] = useState(false);

  const usage = calculateThreadUsage(kinarGrid, palette);

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditName(palette[key]?.name || '');
    setEditHex(palette[key]?.hex || '#000000');
  };

  const saveEdit = () => {
    if (!editingKey) return;
    const nextPalette = {
      ...palette,
      [editingKey]: {
        ...palette[editingKey],
        name: editName.trim() || `Thread #${editingKey}`,
        hex: editHex,
      },
    };
    onUpdatePalette(nextPalette);
    setEditingKey(null);
  };

  const addColor = () => {
    const existingKeys = Object.keys(palette).map(Number);
    const nextKey = existingKeys.length > 0 ? Math.max(...existingKeys) + 1 : 0;
    const defaultColors = ['#1B4D3E', '#132B45', '#4A154B', '#C2410C', '#0284C7'];
    const assignedHex = defaultColors[nextKey % defaultColors.length];

    const nextPalette = {
      ...palette,
      [String(nextKey)]: {
        name: `Color #${nextKey}`,
        hex: assignedHex,
        symbol: `c${nextKey}`,
      },
    };
    onUpdatePalette(nextPalette);
    onSelectStitch(nextKey);
  };

  return (
    <div className="bg-white rounded-xl border border-bohra-border p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-bohra-muted">
            Stitch Palette & Thread Key
          </span>
          <span className="text-[10px] text-bohra-muted bg-bohra-paper px-1.5 py-0.5 rounded font-mono">
            Keys 0-9
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-1 text-[11px] text-bohra-muted hover:text-bohra-text transition-colors"
          >
            <PieChart className="w-3.5 h-3.5 text-gold-600" />
            <span>{showStats ? 'Hide Counts' : 'Thread Counts'}</span>
          </button>
          <button
            onClick={addColor}
            className="flex items-center gap-1 text-[11px] font-medium text-gold-700 hover:text-gold-800 bg-gold-50 hover:bg-gold-100 px-2 py-0.5 rounded transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Color</span>
          </button>
        </div>
      </div>

      {/* Palette Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {Object.entries(palette).map(([keyStr, item]) => {
          const id = Number(keyStr);
          const isActive = activeStitchId === id;
          const isJali = id === 3 || item.name.toLowerCase().includes('jali');
          const threadUsage = usage.find((u) => u.stitchId === id);

          return (
            <div
              key={keyStr}
              className={`relative group rounded-lg border-2 p-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-gold-500 bg-gold-50/50 shadow-md ring-2 ring-gold-200'
                  : 'border-bohra-border hover:border-gold-300 bg-white'
              }`}
              onClick={() => onSelectStitch(id)}
            >
              <div className="flex items-center gap-2">
                {/* Swatch Indicator */}
                <div
                  className="w-6 h-6 rounded-md shadow-sm border border-black/10 flex items-center justify-center font-mono font-bold text-[10px] shrink-0"
                  style={{
                    backgroundColor: item.hex,
                    color: getContrastColor(item.hex),
                    backgroundImage: isJali
                      ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)'
                      : undefined,
                  }}
                >
                  {keyStr}
                </div>

                {/* Details */}
                <div className="overflow-hidden flex-1 min-w-0">
                  <div className="text-xs font-semibold text-bohra-text truncate">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-bohra-muted font-mono flex items-center gap-1">
                    <span>{item.hex}</span>
                    {threadUsage && (
                      <span className="text-gold-700 font-semibold">
                        ({threadUsage.percentage}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(keyStr);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-bohra-paper rounded transition-opacity"
                  title="Edit Color Name / Hex"
                >
                  <Edit2 className="w-3 h-3 text-bohra-muted" />
                </button>
              </div>

              {/* Jali badge */}
              {isJali && (
                <div className="mt-1 text-[9px] font-semibold text-sky-700 bg-sky-50 px-1 py-0.2 rounded inline-block">
                  Open Lace / Ch Space
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Editing Dialog Inline */}
      {editingKey && (
        <div className="mt-3 p-3 bg-bohra-paper rounded-lg border border-bohra-border flex flex-wrap items-center gap-3 animate-fadeIn">
          <span className="text-xs font-bold text-bohra-text">
            Editing Stitch #{editingKey}:
          </span>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Thread name"
            className="text-xs px-2.5 py-1.5 border border-bohra-border rounded bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={editHex}
              onChange={(e) => setEditHex(e.target.value)}
              className="w-7 h-7 rounded border border-bohra-border cursor-pointer"
            />
            <input
              type="text"
              value={editHex}
              onChange={(e) => setEditHex(e.target.value)}
              placeholder="#HEX"
              className="text-xs font-mono w-20 px-2 py-1.5 border border-bohra-border rounded bg-white"
            />
          </div>
          <button
            onClick={saveEdit}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-white font-medium rounded transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply</span>
          </button>
          <button
            onClick={() => setEditingKey(null)}
            className="text-xs px-2.5 py-1.5 text-bohra-muted hover:text-bohra-text"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Thread Counts Breakdown */}
      {showStats && (
        <div className="mt-3 pt-3 border-t border-bohra-border text-xs">
          <div className="font-semibold text-bohra-text mb-1.5">
            Kinar Grid Thread Breakdown:
          </div>
          <div className="flex flex-wrap gap-2">
            {usage.map((u) => (
              <div
                key={u.stitchId}
                className="flex items-center gap-1.5 bg-bohra-paper px-2 py-1 rounded border border-bohra-border text-[11px]"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full border border-black/10"
                  style={{ backgroundColor: u.hex }}
                />
                <span className="font-medium text-bohra-text">{u.name}:</span>
                <span className="font-mono text-bohra-muted">
                  {u.count} sts ({u.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function getContrastColor(hex: string): string {
  if (!hex || !hex.startsWith('#')) return '#000000';
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#111827' : '#FFFFFF';
}
