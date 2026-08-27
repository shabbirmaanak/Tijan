export interface ColorPaletteItem {
  name: string;
  hex: string;
  symbol?: string; // Optional character or pattern texture hint
}

export type ColorPalette = Record<string, ColorPaletteItem>;

export interface CrownRound {
  round: number;
  stitches: number;
  instructions?: string;
}

export interface Pattern {
  id: string;
  title: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  head_size_inches: number;
  gauge_sts_per_inch: number;
  crown_grid: CrownRound[];
  kinar_grid: number[][]; // 2D matrix: row x col
  color_palette: ColorPalette;
  created_at?: number;
  updated_at?: number;
}

export interface StitchRun {
  stitchId: number;
  count: number;
}

export interface ScaleResult {
  repeats: number;
  totalColumns: number;
  actualFitInches: number;
  varianceInches: number;
  motifWidth: number;
}

export interface CrownValidationResult {
  isValid: boolean;
  errors: string[];
  totalStitches?: number;
  calculatedDiameterInches?: number;
}
