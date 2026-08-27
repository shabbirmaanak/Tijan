'use client';

import React, { useState } from 'react';
import { CrownRound } from '@/lib/types';
import { validateCrown, generateFlatCrown } from '@/lib/validator';
import {
  CircleDot,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  X,
  Info,
} from 'lucide-react';

interface CrownDesignerProps {
  rounds: CrownRound[];
  headSizeInches: number;
  gauge: number;
  onUpdateRounds: (newRounds: CrownRound[]) => void;
  onClose?: () => void;
}

export const CrownDesigner: React.FC<CrownDesignerProps> = ({
  rounds,
  headSizeInches,
  gauge,
  onUpdateRounds,
  onClose,
}) => {
  const [baseRate, setBaseRate] = useState<number>(6); // 6 or 8
  const validation = validateCrown(rounds, baseRate);

  const targetDiameterInches = +(headSizeInches / Math.PI).toFixed(2);
  const targetPerimeterStitches = Math.round(headSizeInches * gauge);
  const lastRoundStitches = rounds[rounds.length - 1]?.stitches || 0;

  // Add next round
  const addRound = () => {
    const nextRoundNum = rounds.length + 1;
    const nextStitches = nextRoundNum * baseRate;
    const newRounds = [
      ...rounds,
      {
        round: nextRoundNum,
        stitches: nextStitches,
        instructions: `Round ${nextRoundNum}: *${nextRoundNum - 2 > 0 ? `${nextRoundNum - 2} sc, ` : ''}1 inc* repeat around (${nextStitches} sts)`,
      },
    ];
    onUpdateRounds(newRounds);
  };

  // Remove round
  const removeRound = (index: number) => {
    if (rounds.length <= 1) return;
    const newRounds = rounds.filter((_, idx) => idx !== index);
    onUpdateRounds(newRounds);
  };

  // Auto-generate perfectly flat crown
  const autoFixCrown = () => {
    const ideal = generateFlatCrown(targetPerimeterStitches, baseRate);
    onUpdateRounds(ideal);
  };

  // Update specific round stitches
  const updateStitches = (index: number, val: number) => {
    const updated = rounds.map((r, idx) => (idx === index ? { ...r, stitches: val } : r));
    onUpdateRounds(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-bohra-border p-6 shadow-xl max-w-4xl w-full mx-auto flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-bohra-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gold-50 border border-gold-200 rounded-xl">
            <CircleDot className="w-6 h-6 text-gold-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-bohra-text">
              Crown (Chhat) Designer & Flatness Validator
            </h2>
            <p className="text-xs text-bohra-muted">
              Flat circular disk worked in continuous spiral rounds. Strictly strictly +{baseRate} sts/round expansion.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-bohra-muted hover:text-bohra-text hover:bg-bohra-paper rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Target Math Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bohra-paper/60 p-4 rounded-xl border border-bohra-border text-xs">
        <div>
          <span className="text-bohra-muted text-[11px]">Head Circumference:</span>
          <div className="text-base font-bold text-bohra-text">{headSizeInches}&quot;</div>
        </div>
        <div>
          <span className="text-bohra-muted text-[11px]">Target Crown Diameter:</span>
          <div className="text-base font-bold text-gold-700">
            {targetDiameterInches}&quot; <span className="text-[10px] text-bohra-muted font-normal">(d = C / π)</span>
          </div>
        </div>
        <div>
          <span className="text-bohra-muted text-[11px]">Kinar Target Stitches:</span>
          <div className="text-base font-bold text-bohra-text">{targetPerimeterStitches} sts</div>
        </div>
        <div>
          <span className="text-bohra-muted text-[11px]">Expansion Rate:</span>
          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={() => setBaseRate(6)}
              className={`px-2 py-0.5 rounded font-bold text-xs ${
                baseRate === 6 ? 'bg-gold-600 text-white' : 'bg-white border border-bohra-border text-bohra-text'
              }`}
            >
              +6 / rnd (Standard)
            </button>
            <button
              onClick={() => setBaseRate(8)}
              className={`px-2 py-0.5 rounded font-bold text-xs ${
                baseRate === 8 ? 'bg-gold-600 text-white' : 'bg-white border border-bohra-border text-bohra-text'
              }`}
            >
              +8 / rnd
            </button>
          </div>
        </div>
      </div>

      {/* Flatness Status Card */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
          validation.isValid
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
            : 'bg-rose-50/80 border-rose-300 text-rose-900'
        }`}
      >
        {validation.isValid ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 text-xs">
          <div className="font-bold text-sm mb-0.5">
            {validation.isValid
              ? 'Crown is Perfectly Flat & Valid'
              : `Expansion Formula Violation (${validation.errors.length} round errors)`}
          </div>
          {validation.isValid ? (
            <p className="text-emerald-700">
              All {rounds.length} rounds adhere to strictly +{baseRate} sts/round (round n × {baseRate}).
              Zero risk of cupping (too tight) or ruffling (wavy edges).
            </p>
          ) : (
            <div className="space-y-1 mt-1">
              <ul className="list-disc pl-4 space-y-0.5 text-rose-800 font-mono text-[11px]">
                {validation.errors.slice(0, 4).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              <button
                onClick={autoFixCrown}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Fix & Generate Flat Sequence</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Visual Concentric Circles Preview */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-bohra-paper/40 p-4 rounded-xl border border-bohra-border">
        {/* SVG Concentric Disk */}
        <div className="relative w-64 h-64 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 260 260" className="w-full h-full">
            <defs>
              <radialGradient id="chhatShading" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="80%" stopColor="#FAF8F5" />
                <stop offset="100%" stopColor="#EADEC7" />
              </radialGradient>
            </defs>

            {/* Base circular backing */}
            <circle cx="130" cy="130" r="120" fill="url(#chhatShading)" stroke="#D4AF37" strokeWidth="2" />

            {/* Concentric rings */}
            {rounds.map((r, idx) => {
              const maxRounds = Math.max(rounds.length, 1);
              const radius = 15 + (idx / maxRounds) * 100;
              const isErroneous = r.stitches !== (idx + 1) * baseRate;

              return (
                <g key={idx}>
                  <circle
                    cx="130"
                    cy="130"
                    r={radius}
                    fill="none"
                    stroke={isErroneous ? '#EF4444' : '#D4AF37'}
                    strokeWidth={isErroneous ? '1.8' : '1'}
                    strokeDasharray={idx % 2 === 0 ? 'none' : '3, 2'}
                  />
                  {/* Outer stitch dots for the last few rounds */}
                  {idx === rounds.length - 1 &&
                    Array.from({ length: Math.min(r.stitches, 36) }).map((_, dotIdx) => {
                      const angle = (dotIdx / Math.min(r.stitches, 36)) * Math.PI * 2;
                      const dotX = 130 + radius * Math.cos(angle);
                      const dotY = 130 + radius * Math.sin(angle);
                      return (
                        <circle
                          key={dotIdx}
                          cx={dotX}
                          cy={dotY}
                          r="1.8"
                          fill="#D4AF37"
                        />
                      );
                    })}
                </g>
              );
            })}

            {/* Center Magic Ring Button */}
            <circle cx="130" cy="130" r="6" fill="#D4AF37" />
            <text x="130" y="133" fontSize="8" textAnchor="middle" fill="#FFFFFF" fontWeight="bold">
              MR
            </text>
          </svg>
          <div className="absolute bottom-1 text-[10px] text-bohra-muted font-mono">
            {rounds.length} Rounds • {validation.totalStitches} Total Stitches
          </div>
        </div>

        {/* Round List & Editor */}
        <div className="flex-1 w-full max-h-64 overflow-y-auto pr-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-bohra-text pb-1 border-b border-bohra-border">
            <span>Round-by-Round Construction</span>
            <button
              onClick={addRound}
              className="flex items-center gap-1 text-[11px] font-bold text-gold-700 bg-gold-50 hover:bg-gold-100 px-2 py-0.5 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Round</span>
            </button>
          </div>

          {rounds.map((r, idx) => {
            const expected = (idx + 1) * baseRate;
            const isMatch = r.stitches === expected;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                  isMatch ? 'bg-white border-bohra-border' : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gold-700 w-14">
                    Rnd {idx + 1}:
                  </span>
                  <span className="text-bohra-text text-[11px] truncate max-w-[200px]">
                    {r.instructions || `${r.stitches} stitches`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={r.stitches}
                      onChange={(e) => updateStitches(idx, Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-14 text-center font-mono font-bold text-xs px-1 py-0.5 border border-bohra-border rounded bg-white"
                    />
                    <span className="text-[10px] text-bohra-muted">sts</span>
                  </div>

                  <button
                    onClick={() => removeRound(idx)}
                    disabled={rounds.length <= 1}
                    className="p-1 text-bohra-muted hover:text-rose-600 disabled:opacity-20"
                    title="Delete Round"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
