'use client';

import React, { useState } from 'react';
import { Pattern } from '@/lib/types';
import { formatCrochetInstructions, calculateThreadUsage } from '@/lib/compiler';
import {
  Printer,
  Copy,
  Check,
  X,
  FileText,
  Layers,
  CircleDot,
  Download,
} from 'lucide-react';

interface PrintExportModalProps {
  pattern: Pattern;
  onClose: () => void;
}

export const PrintExportModal: React.FC<PrintExportModalProps> = ({
  pattern,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [exportTab, setExportTab] = useState<'preview' | 'rawText'>('preview');

  const instructions = formatCrochetInstructions(pattern.kinar_grid, pattern.color_palette);
  const threadUsage = calculateThreadUsage(pattern.kinar_grid, pattern.color_palette);

  const totalKinarStitches = pattern.kinar_grid.reduce(
    (acc, row) => acc + row.length,
    0
  );
  const totalCrownStitches = pattern.crown_grid.reduce(
    (acc, r) => acc + r.stitches,
    0
  );

  const fullTextExport = `=====================================================
TOPICROCHET VAULT - PRODUCTION PATTERN SHEET
Pattern: ${pattern.title}
Difficulty: ${pattern.difficulty_level.toUpperCase()}
Head Circumference: ${pattern.head_size_inches}"
Gauge: ${pattern.gauge_sts_per_inch} sts/inch
Kinar Dimensions: ${pattern.kinar_grid.length} Rows x ${pattern.kinar_grid[0]?.length || 0} Columns (${totalKinarStitches} Total Sts)
Crown Rounds: ${pattern.crown_grid.length} Rounds (${totalCrownStitches} Total Sts)
=====================================================

DESCRIPTION:
${pattern.description || 'Traditional handcrafted Dawoodi Bohra Topi.'}

COLOR PALETTE & THREAD KEY:
${Object.entries(pattern.color_palette)
  .map(([k, v]) => `  [#${k}] ${v.name} (${v.hex})`)
  .join('\n')}

THREAD USAGE ESTIMATION:
${threadUsage.map((u) => `  - ${u.name}: ${u.count} stitches (${u.percentage}%)`).join('\n')}

-----------------------------------------------------
SECTION 1: CROWN (CHHAT) CONSTRUCTION
Worked in continuous spiral rounds without joining.
-----------------------------------------------------
${pattern.crown_grid
  .map((r, i) => `Round ${r.round || i + 1}: ${r.instructions || `${r.stitches} sc around`}`)
  .join('\n')}

-----------------------------------------------------
SECTION 2: SIDE WALL (KINAR) ROW-BY-ROW INSTRUCTIONS
-----------------------------------------------------
${instructions.join('\n')}

=====================================================
Crafted with Topi Crochet Vector & Grid Pattern Vault
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullTextExport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(pattern, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${pattern.id || 'topi-pattern'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-bohra-border shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-bohra-border bg-bohra-paper/50">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-gold-600" />
            <h3 className="text-base font-bold text-bohra-text">
              Printable Pattern Sheet & Export
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View Tabs */}
            <div className="flex items-center bg-white rounded-lg border border-bohra-border p-0.5 text-xs">
              <button
                onClick={() => setExportTab('preview')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  exportTab === 'preview' ? 'bg-gold-500 text-white font-bold' : 'text-bohra-muted hover:text-bohra-text'
                }`}
              >
                Print Preview
              </button>
              <button
                onClick={() => setExportTab('rawText')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  exportTab === 'rawText' ? 'bg-gold-500 text-white font-bold' : 'text-bohra-muted hover:text-bohra-text'
                }`}
              >
                Raw Text
              </button>
            </div>

            <button
              onClick={downloadJson}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-white hover:bg-gold-50 border border-bohra-border rounded-lg text-bohra-text transition-colors"
              title="Download JSON definition"
            >
              <Download className="w-3.5 h-3.5 text-gold-600" />
              <span>JSON</span>
            </button>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white hover:bg-gold-50 border border-bohra-border rounded-lg text-bohra-text transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gold-600" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 text-xs font-bold px-4 py-1.5 bg-gold-600 hover:bg-gold-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-bohra-muted hover:text-bohra-text rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-bohra-paper/30">
          {exportTab === 'rawText' ? (
            <textarea
              readOnly
              value={fullTextExport}
              className="w-full h-[500px] font-mono text-xs p-4 bg-white border border-bohra-border rounded-xl focus:outline-none select-all"
            />
          ) : (
            <div className="bg-white border border-bohra-border rounded-xl p-8 shadow-sm space-y-6 print-card text-bohra-text">
              {/* Pattern Sheet Header */}
              <div className="border-b-2 border-gold-400 pb-4 flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-bold tracking-widest uppercase text-gold-700 mb-0.5">
                    Dawoodi Bohra Topi Crochet Pattern
                  </div>
                  <h1 className="text-2xl font-serif font-bold text-bohra-text">
                    {pattern.title}
                  </h1>
                  <p className="text-xs text-bohra-muted mt-1 max-w-xl">
                    {pattern.description}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-bold px-2.5 py-1 rounded-full bg-gold-100 text-gold-800 border border-gold-300">
                    {pattern.difficulty_level}
                  </span>
                </div>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-bohra-paper rounded-xl border border-bohra-border text-xs">
                <div>
                  <span className="text-bohra-muted text-[11px] block">Head Size:</span>
                  <span className="font-bold text-bohra-text text-sm">
                    {pattern.head_size_inches}&quot; ({(pattern.head_size_inches * 2.54).toFixed(1)} cm)
                  </span>
                </div>
                <div>
                  <span className="text-bohra-muted text-[11px] block">Gauge:</span>
                  <span className="font-bold text-bohra-text text-sm">
                    {pattern.gauge_sts_per_inch} sts/in
                  </span>
                </div>
                <div>
                  <span className="text-bohra-muted text-[11px] block">Kinar Dimensions:</span>
                  <span className="font-bold text-bohra-text text-sm">
                    {pattern.kinar_grid.length} Rows × {pattern.kinar_grid[0]?.length || 0} Cols
                  </span>
                </div>
                <div>
                  <span className="text-bohra-muted text-[11px] block">Total Stitches:</span>
                  <span className="font-bold text-gold-700 text-sm">
                    {totalKinarStitches + totalCrownStitches} sts
                  </span>
                </div>
              </div>

              {/* Thread Legend & Requirements */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-bohra-muted mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-gold-600" />
                  <span>Color Palette & Material Breakdown</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {threadUsage.map((u) => (
                    <div
                      key={u.stitchId}
                      className="flex items-center justify-between p-2.5 bg-bohra-paper/60 rounded-lg border border-bohra-border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-md border border-black/10 shadow-sm"
                          style={{ backgroundColor: u.hex }}
                        />
                        <span className="font-bold text-bohra-text">
                          Stitch #{u.stitchId}: {u.name}
                        </span>
                      </div>
                      <span className="font-mono text-bohra-muted font-medium">
                        {u.count} sts ({u.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 1: Crown (Chhat) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-bohra-muted flex items-center gap-1.5">
                  <CircleDot className="w-3.5 h-3.5 text-gold-600" />
                  <span>Section 1: Crown (Chhat) Instructions</span>
                </h4>
                <div className="p-3 bg-bohra-paper/40 rounded-xl border border-bohra-border divide-y divide-bohra-border/50 text-xs">
                  {pattern.crown_grid.map((r, i) => (
                    <div key={i} className="py-1.5 flex items-center justify-between">
                      <span className="font-mono font-bold text-gold-700 w-20">
                        Round {r.round || i + 1}:
                      </span>
                      <span className="flex-1 text-bohra-text">
                        {r.instructions || `Work ${r.stitches} stitches around evenly`}
                      </span>
                      <span className="font-mono text-bohra-muted font-semibold">
                        ({r.stitches} sts)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Kinar Row-by-Row Instructions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-bohra-muted flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gold-600" />
                  <span>Section 2: Side Wall (Kinar) Row-by-Row Instructions</span>
                </h4>
                <div className="p-4 bg-bohra-paper/40 rounded-xl border border-bohra-border space-y-1.5 font-mono text-xs max-h-[360px] overflow-y-auto">
                  {instructions.map((inst, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded hover:bg-white transition-colors flex items-start justify-between border-b border-bohra-border/30 last:border-b-0"
                    >
                      <span className="text-bohra-text">{inst}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-[11px] text-bohra-muted pt-3 border-t border-bohra-border flex items-center justify-between">
                <span>Topi Crochet Vector & Grid Pattern Vault • Handcrafted Heritage</span>
                <span>libSQL / Turso SQLite Edge Architecture</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
