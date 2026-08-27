'use client';

import React from 'react';
import { HelpCircle, X, Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface CraftGuideModalProps {
  onClose: () => void;
}

export const CraftGuideModal: React.FC<CraftGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-bohra-border shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn text-bohra-text">
        <div className="p-4 border-b border-bohra-border bg-bohra-paper/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gold-600" />
            <h3 className="text-base font-bold text-bohra-text">
              Dawoodi Bohra Topi Crafting & Math Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-bohra-muted hover:text-bohra-text rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Section 1: Anatomy */}
          <div className="bg-bohra-paper/60 p-4 rounded-xl border border-bohra-border space-y-2">
            <h4 className="font-bold text-sm text-bohra-text flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gold-600" />
              1. Anatomy of a Handcrafted Bohra Topi
            </h4>
            <p className="text-bohra-muted leading-relaxed">
              A traditional Bohra Topi consists of two seamlessly interconnected components:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-lg border border-bohra-border">
                <div className="font-bold text-gold-700 mb-1">Crown (Chhat):</div>
                <p className="text-bohra-muted text-[11px]">
                  The flat circular disc at the apex. Worked in continuous spiral rounds without turning or joining. Strictly expands by <strong>+6 (or +8)</strong> stitches per round.
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-bohra-border">
                <div className="font-bold text-gold-700 mb-1">Side Wall (Kinar):</div>
                <p className="text-bohra-muted text-[11px]">
                  The vertical cylindrical band (20–30 rows high × 180–240 stitches wide) carrying the intricate Kasab gold and silk geometric or floral motifs.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Mathematical Rules */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-bohra-text flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gold-600" />
              2. Domain Rules & Core Math
            </h4>
            <div className="p-3.5 bg-gold-50/50 rounded-xl border border-gold-200 space-y-2 font-mono text-[11px]">
              <div>
                <strong>Crown Expansion:</strong> Stitch Count in Round n = n × 6 (Base Rate)
                <div className="text-bohra-muted text-[10px] font-sans">
                  Deviating below expected stitches causes cupping; exceeding causes ruffling/waving.
                </div>
              </div>
              <div>
                <strong>Target Kinar Stitches:</strong> Total Stitches = Head Size (inches) × Gauge (sts/in)
              </div>
              <div>
                <strong>Motif Scaling:</strong> Repeats = round(Target Stitches / Motif Width)
              </div>
              <div>
                <strong>Crown Diameter:</strong> Diameter = Head Circumference / π
              </div>
            </div>
          </div>

          {/* Section 3: Stitch Key */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-bohra-text flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gold-600" />
              3. Standard Stitch Key
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded border border-bohra-border flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-bohra-cream border border-black/10 flex items-center justify-center font-bold font-mono">0</span>
                <span><strong>0: Base Stitch</strong> (Single Crochet / White)</span>
              </div>
              <div className="p-2 bg-white rounded border border-bohra-border flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-gold-500 text-white flex items-center justify-center font-bold font-mono">1</span>
                <span><strong>1: Kasab Gold</strong> (Primary Gold Metallic)</span>
              </div>
              <div className="p-2 bg-white rounded border border-bohra-border flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-bohra-maroon text-white flex items-center justify-center font-bold font-mono">2</span>
                <span><strong>2: Silk Color</strong> (Maroon / Emerald Accent)</span>
              </div>
              <div className="p-2 bg-white rounded border border-bohra-border flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-sky-100 text-sky-800 border border-sky-300 flex items-center justify-center font-bold font-mono">3</span>
                <span><strong>3: Jali</strong> (Open Chain Space / Lace)</span>
              </div>
            </div>
          </div>

          {/* Section 4: Kasab Thread Working Tips */}
          <div className="space-y-1 bg-bohra-paper/40 p-3 rounded-xl border border-bohra-border text-[11px] text-bohra-muted">
            <div className="font-bold text-bohra-text mb-1">Master Artisan Tips for Kasab Thread:</div>
            <ul className="list-disc pl-4 space-y-1">
              <li>Carry unused thread strands inside the stitches (tapestry crochet technique) to keep the inner surface smooth.</li>
              <li>Maintain consistent tension when introducing metallic Kasab thread to prevent puckering.</li>
              <li>When joining the crown to the Kinar side wall, match each stitch 1-to-1 without skipping.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
