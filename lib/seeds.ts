import { Pattern } from './types';
import { generateFlatCrown } from './validator';
import { tileMotifMatrix } from './scaling';

// 1. 7-Line Geometric Kasab Motif (24 rows x 15 cols)
// 0: White, 1: Kasab Gold, 2: Silk Maroon
const geometric7LineMotif: number[][] = [
  // Row 1-3: Base White rows with kasab rim
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  // Row 4-7: Stepped Geometric Lines
  [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
  [0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
  [1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1],
  [0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
  // Row 8-10: Center 7-Line Kasab Chevron Peak
  [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Row 11-14: Central Diamond Chevron
  [0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 0, 0],
  [0, 1, 1, 2, 2, 1, 0, 0, 0, 1, 2, 2, 1, 1, 0],
  [1, 1, 2, 2, 1, 0, 0, 0, 0, 0, 1, 2, 2, 1, 1],
  [0, 1, 1, 2, 2, 1, 0, 0, 0, 1, 2, 2, 1, 1, 0],
  [0, 0, 1, 1, 2, 2, 1, 1, 1, 2, 2, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 1, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 0],
  // Row 20-22: Upper Gold Bands
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
  // Row 23-24: Crown Boundary Kasab lines
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// 2. Diamond Jali Motif (24 rows x 14 cols)
// 0: White, 1: Kasab Gold, 2: Silk Green, 3: Jali (Open stitch)
const diamondJaliMotif: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 3, 3, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 3, 2, 2, 3, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 3, 2, 1, 1, 2, 3, 1, 0, 0, 0],
  [0, 0, 1, 3, 2, 1, 0, 0, 1, 2, 3, 1, 0, 0],
  [0, 1, 3, 2, 1, 0, 0, 0, 0, 1, 2, 3, 1, 0],
  [1, 3, 2, 1, 0, 0, 0, 0, 0, 0, 1, 2, 3, 1],
  [0, 1, 3, 2, 1, 0, 0, 0, 0, 1, 2, 3, 1, 0],
  [0, 0, 1, 3, 2, 1, 0, 0, 1, 2, 3, 1, 0, 0],
  [0, 0, 0, 1, 3, 2, 1, 1, 2, 3, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 3, 2, 2, 3, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 3, 3, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// 3. Floral Chevron Motif (24 rows x 15 cols)
// 0: White, 1: Kasab Gold, 2: Silk Maroon, 3: Silk Green
const floralChevronMotif: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 2, 2, 2, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 2, 2, 1, 2, 2, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 2, 2, 1, 0, 1, 2, 2, 1, 0, 0, 0],
  [0, 0, 1, 2, 2, 1, 0, 0, 0, 1, 2, 2, 1, 0, 0],
  [0, 1, 2, 2, 1, 0, 0, 1, 0, 0, 1, 2, 2, 1, 0],
  [1, 2, 2, 1, 0, 0, 1, 1, 1, 0, 0, 1, 2, 2, 1],
  [2, 2, 1, 0, 0, 1, 1, 2, 1, 1, 0, 0, 1, 2, 2],
  [2, 1, 0, 0, 1, 1, 2, 2, 2, 1, 1, 0, 0, 1, 2],
  [1, 0, 0, 1, 1, 2, 2, 1, 2, 2, 1, 1, 0, 0, 1],
  [0, 0, 1, 1, 2, 2, 1, 0, 1, 2, 2, 1, 1, 0, 0],
  [0, 1, 1, 2, 2, 1, 0, 0, 0, 1, 2, 2, 1, 1, 0],
  [1, 1, 2, 2, 1, 0, 0, 0, 0, 0, 1, 2, 2, 1, 1],
  [0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 0],
  [0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const seedPatterns: Pattern[] = [
  {
    id: 'topi-7line-kasab',
    title: '7-Line Geometric Kasab',
    description: 'Classic handcrafted Bohra Topi design featuring authentic 7-line parallel Kasab gold bands with stepped central chevron geometry and silk accents.',
    difficulty_level: 'intermediate',
    head_size_inches: 21.0,
    gauge_sts_per_inch: 10.0,
    crown_grid: generateFlatCrown(210, 6),
    kinar_grid: tileMotifMatrix(geometric7LineMotif, 14), // 15 cols x 14 repeats = 210 cols
    color_palette: {
      '0': { name: 'White Cotton', hex: '#FAF8F5', symbol: 'sc' },
      '1': { name: 'Kasab Gold', hex: '#D4AF37', symbol: 'kg' },
      '2': { name: 'Silk Maroon', hex: '#781D22', symbol: 'sm' },
    },
  },
  {
    id: 'topi-diamond-jali',
    title: 'Diamond Jali Lattice',
    description: 'Intricate openwork lace (Jali) lattice framed with bright Kasab gold borders and emerald silk diamond centers for a breezy summer Topi.',
    difficulty_level: 'advanced',
    head_size_inches: 21.0,
    gauge_sts_per_inch: 10.0,
    crown_grid: generateFlatCrown(210, 6),
    kinar_grid: tileMotifMatrix(diamondJaliMotif, 15), // 14 cols x 15 repeats = 210 cols
    color_palette: {
      '0': { name: 'White Cotton', hex: '#FAF8F5', symbol: 'sc' },
      '1': { name: 'Kasab Gold', hex: '#D4AF37', symbol: 'kg' },
      '2': { name: 'Emerald Silk', hex: '#1B4D3E', symbol: 'es' },
      '3': { name: 'Jali Open Stitch', hex: '#7DD3FC', symbol: 'ch' },
    },
  },
  {
    id: 'topi-floral-chevron',
    title: 'Floral Chevron Paisley',
    description: 'Stepped floral chevron motif with traditional Kasab gold leaf tips, ruby silk blossoms, and crisp white single crochet groundwork.',
    difficulty_level: 'intermediate',
    head_size_inches: 21.0,
    gauge_sts_per_inch: 10.0,
    crown_grid: generateFlatCrown(210, 6),
    kinar_grid: tileMotifMatrix(floralChevronMotif, 14), // 15 cols x 14 repeats = 210 cols
    color_palette: {
      '0': { name: 'White Cotton', hex: '#FAF8F5', symbol: 'sc' },
      '1': { name: 'Kasab Gold', hex: '#D4AF37', symbol: 'kg' },
      '2': { name: 'Ruby Silk', hex: '#991B1B', symbol: 'rs' },
      '3': { name: 'Emerald Silk', hex: '#1B4D3E', symbol: 'es' },
    },
  },
];
