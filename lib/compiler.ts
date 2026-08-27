import { ColorPalette, StitchRun } from './types';

/**
 * Compresses a single row of numeric stitch IDs into run-length encoded (RLE) segments.
 */
export function compressRowToRuns(row: number[]): StitchRun[] {
  if (!row || !row.length) return [];
  const runs: StitchRun[] = [];
  let currentStitch = row[0];
  let count = 0;

  for (const st of row) {
    if (st === currentStitch) {
      count++;
    } else {
      runs.push({ stitchId: currentStitch, count });
      currentStitch = st;
      count = 1;
    }
  }
  runs.push({ stitchId: currentStitch, count });
  return runs;
}

/**
 * Compiles a 2D Kinar grid into row-by-row human-readable crochet instructions.
 */
export function formatCrochetInstructions(
  kinarGrid: number[][],
  palette: ColorPalette
): string[] {
  if (!kinarGrid || !kinarGrid.length) return [];

  return kinarGrid.map((row, idx) => {
    const runs = compressRowToRuns(row);
    const steps = runs
      .map((r) => `${r.count} ${palette[r.stitchId]?.name || `Thread #${r.stitchId}`}`)
      .join(', ');
    const total = runs.reduce((a, b) => a + b.count, 0);
    return `Row ${idx + 1}: ${steps} (Total: ${total} sts)`;
  });
}

/**
 * Compiles aggregated stitch and thread counts for the full pattern (e.g. for yardage / material planning).
 */
export function calculateThreadUsage(
  kinarGrid: number[][],
  palette: ColorPalette
): { stitchId: number; name: string; hex: string; count: number; percentage: number }[] {
  const counts: Record<number, number> = {};
  let totalStitches = 0;

  for (const row of kinarGrid) {
    for (const st of row) {
      counts[st] = (counts[st] || 0) + 1;
      totalStitches++;
    }
  }

  return Object.entries(counts).map(([idStr, count]) => {
    const id = Number(idStr);
    const item = palette[id] || { name: `Thread #${id}`, hex: '#888888' };
    return {
      stitchId: id,
      name: item.name,
      hex: item.hex,
      count,
      percentage: totalStitches > 0 ? +((count / totalStitches) * 100).toFixed(1) : 0,
    };
  }).sort((a, b) => b.count - a.count);
}
