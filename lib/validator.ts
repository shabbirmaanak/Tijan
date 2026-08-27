import { CrownRound, CrownValidationResult } from './types';

/**
 * Crown (Chhat) Flatness Validator.
 * Verifies that the stitch count in each round strictly expands by the base amount (+6 or +8)
 * following the formula: Stitch Count = Round * Base.
 * Deviation causes cupping (too few stitches) or ruffling/waving (too many stitches).
 */
export function validateCrown(
  rounds: { round: number; stitches: number }[],
  base = 6
): CrownValidationResult {
  const errors: string[] = [];
  let totalStitches = 0;

  if (!rounds || !rounds.length) {
    return {
      isValid: false,
      errors: ['Crown requires at least 1 round.'],
      totalStitches: 0,
    };
  }

  rounds.forEach((r, idx) => {
    const roundNumber = r.round || idx + 1;
    const expected = roundNumber * base;
    totalStitches += r.stitches;

    if (r.stitches !== expected) {
      const diff = r.stitches - expected;
      const defect = diff > 0 ? 'ruffling/waving risk' : 'cupping/tightness risk';
      errors.push(
        `Round ${roundNumber}: ${r.stitches} sts (expected ${expected}, diff ${diff > 0 ? `+${diff}` : diff} [${defect}])`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    totalStitches,
  };
}

/**
 * Generates an ideal flat Crown (Chhat) round sequence up to target stitches / diameter.
 * Formula: Stitch Count = round * base.
 */
export function generateFlatCrown(targetStitches: number, base = 6): CrownRound[] {
  const rounds: CrownRound[] = [];
  let currentStitches = 0;
  let roundNum = 1;

  while (currentStitches < targetStitches || roundNum <= 10) {
    const sts = roundNum * base;
    rounds.push({
      round: roundNum,
      stitches: sts,
      instructions: roundNum === 1 
        ? `Magic ring, work ${sts} sc` 
        : `*${roundNum - 2 > 0 ? `${roundNum - 2} sc, ` : ''}1 inc* repeat around (${sts} sts)`,
    });
    currentStitches = sts;
    if (currentStitches >= targetStitches) break;
    roundNum++;
  }

  return rounds;
}
