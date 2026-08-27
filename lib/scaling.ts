import { ScaleResult } from './types';

/**
 * Size Scaling Engine for Bohra Topi Kinar (Side Wall).
 * Given target head size (inches), gauge (stitches/inch), and base motif width,
 * computes the optimal number of repeats, final columns, actual fit, and variance.
 */
export function scalePatternWidth(
  targetHeadSize: number,
  gauge: number,
  baseMotifWidth: number
): ScaleResult {
  if (baseMotifWidth <= 0 || gauge <= 0) {
    return {
      repeats: 1,
      totalColumns: baseMotifWidth || 1,
      actualFitInches: targetHeadSize,
      varianceInches: 0,
      motifWidth: baseMotifWidth,
    };
  }

  const targetStitches = targetHeadSize * gauge;
  const repeats = Math.max(1, Math.round(targetStitches / baseMotifWidth));
  const totalColumns = repeats * baseMotifWidth;
  const actualFitInches = totalColumns / gauge;

  return {
    repeats,
    totalColumns,
    actualFitInches: +(actualFitInches.toFixed(2)),
    varianceInches: +(actualFitInches - targetHeadSize).toFixed(2),
    motifWidth: baseMotifWidth,
  };
}

/**
 * Tiles a single base motif matrix horizontally by a given number of repeats
 * to form the complete cylindrical Kinar grid (e.g. 15 cols x 14 repeats = 210 cols).
 */
export function tileMotifMatrix(motifGrid: number[][], repeats: number): number[][] {
  if (!motifGrid || !motifGrid.length) return [];
  const safeRepeats = Math.max(1, Math.floor(repeats));

  return motifGrid.map((row) => {
    const fullRow: number[] = [];
    for (let r = 0; r < safeRepeats; r++) {
      fullRow.push(...row);
    }
    return fullRow;
  });
}
