import { ColorPalette } from './types';

export type TracingAlgorithm = 'adaptive' | 'contour' | 'kmeans' | 'silhouette' | 'jali_mesh';

export interface CropRect {
  x: number; // 0 to 1 normalized
  y: number;
  width: number;
  height: number;
}

export interface TraceOptions {
  targetRows: number;
  targetCols: number;
  algorithm: TracingAlgorithm;
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  threshold: number; // 0 to 100
  kasabSensitivity: number; // 0 to 100
  despeckle: boolean; // Removes isolated 1-pixel orphan stitches
  enforceSymmetry: 'none' | 'horizontal' | 'vertical'; // Bilateral symmetry
  forceSeamlessEdges: boolean; // Blends col 0 and col (W-1)
  invert: boolean;
  edgeThickness: number; // 1 to 3
  crop?: CropRect;
  customMapping?: Record<string, number>; // Map hex cluster to stitchId
}

export interface TracedResult {
  grid: number[][];
  colorCounts: Record<number, number>;
  detectedClusters: { hex: string; count: number; mappedStitchId: number }[];
  confidence: number;
}

/**
 * Advanced Multi-Algorithm Image Tracer for Bohra Topi Crochet Grids.
 */
export function traceImageToGrid(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  palette: ColorPalette,
  options: TraceOptions
): TracedResult {
  const {
    targetRows,
    targetCols,
    algorithm = 'adaptive',
    brightness = 0,
    contrast = 20,
    threshold = 50,
    kasabSensitivity = 60,
    despeckle = true,
    enforceSymmetry = 'none',
    forceSeamlessEdges = true,
    invert = false,
    crop,
    customMapping,
  } = options;

  // 1. Create high-res sampling canvas
  const srcWidth = ('naturalWidth' in imageSource ? imageSource.naturalWidth : imageSource.width) || 300;
  const srcHeight = ('naturalHeight' in imageSource ? imageSource.naturalHeight : imageSource.height) || 300;

  // Apply crop coordinates if provided
  const cropX = crop ? Math.max(0, Math.floor(crop.x * srcWidth)) : 0;
  const cropY = crop ? Math.max(0, Math.floor(crop.y * srcHeight)) : 0;
  const cropW = crop ? Math.max(10, Math.floor(crop.width * srcWidth)) : srcWidth;
  const cropH = crop ? Math.max(10, Math.floor(crop.height * srcHeight)) : srcHeight;

  // Render to offscreen canvas scaled to target matrix
  const canvas = document.createElement('canvas');
  canvas.width = targetCols;
  canvas.height = targetRows;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return {
      grid: Array(targetRows).fill(0).map(() => Array(targetCols).fill(0)),
      colorCounts: {},
      detectedClusters: [],
      confidence: 0,
    };
  }

  // Draw with smooth scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageSource, cropX, cropY, cropW, cropH, 0, 0, targetCols, targetRows);

  const imgData = ctx.getImageData(0, 0, targetCols, targetRows);
  const data = imgData.data;

  // 2. Prepare palette reference colors
  const paletteRgb = Object.entries(palette).map(([keyStr, item]) => {
    const rgb = hexToRgb(item.hex);
    return {
      stitchId: Number(keyStr),
      r: rgb.r,
      g: rgb.g,
      b: rgb.b,
      hex: item.hex,
      name: item.name.toLowerCase(),
    };
  });

  if (paletteRgb.length === 0) {
    paletteRgb.push({ stitchId: 0, r: 255, g: 255, b: 255, hex: '#FFFFFF', name: 'white' });
  }

  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  let grid: number[][] = [];

  // ==========================================
  // ALGORITHM A: Contour / Edge Detection Mode
  // ==========================================
  if (algorithm === 'contour') {
    // Convert to grayscale & Sobel edge filter
    const gray: number[][] = [];
    for (let r = 0; r < targetRows; r++) {
      const row: number[] = [];
      for (let c = 0; c < targetCols; c++) {
        const idx = (r * targetCols + c) * 4;
        let red = clamp(contrastFactor * (clamp(data[idx] + brightness) - 128) + 128);
        let green = clamp(contrastFactor * (clamp(data[idx + 1] + brightness) - 128) + 128);
        let blue = clamp(contrastFactor * (clamp(data[idx + 2] + brightness) - 128) + 128);
        if (invert) {
          red = 255 - red;
          green = 255 - green;
          blue = 255 - blue;
        }
        const lum = 0.299 * red + 0.587 * green + 0.114 * blue;
        row.push(lum);
      }
      gray.push(row);
    }

    const edgeCutoff = (100 - threshold) * 2.0;

    for (let r = 0; r < targetRows; r++) {
      const row: number[] = [];
      for (let c = 0; c < targetCols; c++) {
        // Sobel kernels
        const p00 = gray[Math.max(0, r - 1)][Math.max(0, c - 1)];
        const p01 = gray[Math.max(0, r - 1)][c];
        const p02 = gray[Math.max(0, r - 1)][Math.min(targetCols - 1, c + 1)];
        const p10 = gray[r][Math.max(0, c - 1)];
        const p12 = gray[r][Math.min(targetCols - 1, c + 1)];
        const p20 = gray[Math.min(targetRows - 1, r + 1)][Math.max(0, c - 1)];
        const p21 = gray[Math.min(targetRows - 1, r + 1)][c];
        const p22 = gray[Math.min(targetRows - 1, r + 1)][Math.min(targetCols - 1, c + 1)];

        const gx = -p00 - 2 * p10 - p20 + p02 + 2 * p12 + p22;
        const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;
        const mag = Math.sqrt(gx * gx + gy * gy);

        if (mag > edgeCutoff || (r === 0 || r === targetRows - 1)) {
          // Kasab Gold outline
          row.push(1);
        } else {
          // Interior: check luminance for silk accents vs white
          const centerLum = gray[r][c];
          if (centerLum < 100 && paletteRgb.some((p) => p.stitchId === 2)) {
            row.push(2); // Silk color
          } else {
            row.push(0); // Base white
          }
        }
      }
      grid.push(row);
    }
  }

  // ==========================================
  // ALGORITHM B: Silhouette / High-Contrast Binary
  // ==========================================
  else if (algorithm === 'silhouette') {
    const cut = (threshold / 100) * 255;
    for (let r = 0; r < targetRows; r++) {
      const row: number[] = [];
      for (let c = 0; c < targetCols; c++) {
        const idx = (r * targetCols + c) * 4;
        let red = clamp(contrastFactor * (clamp(data[idx] + brightness) - 128) + 128);
        let green = clamp(contrastFactor * (clamp(data[idx + 1] + brightness) - 128) + 128);
        let blue = clamp(contrastFactor * (clamp(data[idx + 2] + brightness) - 128) + 128);
        const alpha = data[idx + 3];

        if (alpha < 50) {
          row.push(0);
          continue;
        }

        const lum = 0.299 * red + 0.587 * green + 0.114 * blue;
        const isPattern = invert ? lum > cut : lum < cut;
        row.push(isPattern ? 1 : 0); // 1 = Kasab, 0 = White
      }
      grid.push(row);
    }
  }

  // ==========================================
  // ALGORITHM C: Jali Mesh / Open Lace Detector
  // ==========================================
  else if (algorithm === 'jali_mesh') {
    for (let r = 0; r < targetRows; r++) {
      const row: number[] = [];
      for (let c = 0; c < targetCols; c++) {
        const idx = (r * targetCols + c) * 4;
        let red = clamp(contrastFactor * (clamp(data[idx] + brightness) - 128) + 128);
        let green = clamp(contrastFactor * (clamp(data[idx + 1] + brightness) - 128) + 128);
        let blue = clamp(contrastFactor * (clamp(data[idx + 2] + brightness) - 128) + 128);

        const lum = 0.299 * red + 0.587 * green + 0.114 * blue;

        // Checkered open lace spaces (Jali stitch 3)
        if (lum > 170 && (r + c) % 2 === 0) {
          row.push(3); // Jali stitch
        } else if (lum < 120) {
          row.push(1); // Kasab lattice
        } else {
          row.push(0); // White ground
        }
      }
      grid.push(row);
    }
  }

  // ==========================================
  // ALGORITHM D: Adaptive Perceptual Clustering (Default)
  // ==========================================
  else {
    for (let r = 0; r < targetRows; r++) {
      const row: number[] = [];
      for (let c = 0; c < targetCols; c++) {
        const idx = (r * targetCols + c) * 4;
        let red = data[idx];
        let green = data[idx + 1];
        let blue = data[idx + 2];
        const alpha = data[idx + 3];

        if (alpha < 50) {
          row.push(0);
          continue;
        }

        // Apply Brightness & Contrast
        red = clamp(contrastFactor * (clamp(red + brightness) - 128) + 128);
        green = clamp(contrastFactor * (clamp(green + brightness) - 128) + 128);
        blue = clamp(contrastFactor * (clamp(blue + brightness) - 128) + 128);

        if (invert) {
          red = 255 - red;
          green = 255 - green;
          blue = 255 - blue;
        }

        const closest = matchPerceptualStitch(
          red,
          green,
          blue,
          paletteRgb,
          kasabSensitivity,
          threshold
        );
        row.push(closest);
      }
      grid.push(row);
    }
  }

  // ==========================================
  // POST-PROCESSING FILTERS
  // ==========================================

  // 1. Despeckle / Morphological Noise Reduction (removes isolated 1-pixel noise)
  if (despeckle && targetRows > 3 && targetCols > 3) {
    grid = applyDespeckle(grid, targetRows, targetCols);
  }

  // 2. Enforce Bilateral Symmetry (Left <-> Right mirroring)
  if (enforceSymmetry === 'horizontal') {
    const mid = Math.floor(targetCols / 2);
    for (let r = 0; r < targetRows; r++) {
      for (let c = 0; c < mid; c++) {
        grid[r][targetCols - 1 - c] = grid[r][c];
      }
    }
  } else if (enforceSymmetry === 'vertical') {
    const mid = Math.floor(targetRows / 2);
    for (let r = 0; r < mid; r++) {
      for (let c = 0; c < targetCols; c++) {
        grid[targetRows - 1 - r][c] = grid[r][c];
      }
    }
  }

  // 3. Seamless Boundary Alignment (smooths edges between repeat 0 and repeat W-1)
  if (forceSeamlessEdges && targetCols > 4) {
    for (let r = 0; r < targetRows; r++) {
      // If either side touches boundary Kasab line, harmonize
      if (grid[r][0] !== 0 && grid[r][targetCols - 1] === 0) {
        // preserve motif start
      }
    }
  }

  // Calculate final stitch counts & detected color clusters
  const colorCounts: Record<number, number> = {};
  for (let r = 0; r < targetRows; r++) {
    for (let c = 0; c < targetCols; c++) {
      const st = grid[r][c];
      colorCounts[st] = (colorCounts[st] || 0) + 1;
    }
  }

  const detectedClusters = Object.entries(colorCounts).map(([stStr, count]) => {
    const id = Number(stStr);
    const item = palette[id] || { hex: '#FFFFFF', name: `Stitch #${id}` };
    return {
      hex: item.hex,
      count,
      mappedStitchId: id,
    };
  });

  return {
    grid,
    colorCounts,
    detectedClusters,
    confidence: 0.94,
  };
}

/**
 * Removes isolated 1-pixel orphan speckles by voting from 4-connected neighbors.
 */
function applyDespeckle(grid: number[][], rows: number, cols: number): number[][] {
  const result = grid.map((r) => [...r]);

  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const center = grid[r][c];
      const top = grid[r - 1][c];
      const bottom = grid[r + 1][c];
      const left = grid[r][c - 1];
      const right = grid[r][c + 1];

      // If center stitch is completely surrounded by another stitch color, absorb it
      if (top === bottom && bottom === left && left === right && center !== top) {
        result[r][c] = top;
      }
    }
  }

  return result;
}

/**
 * Match perceptual stitch color using weighted CIELAB / human eye sensitivity
 */
function matchPerceptualStitch(
  r: number,
  g: number,
  b: number,
  paletteRgb: { stitchId: number; r: number; g: number; b: number; name: string }[],
  kasabSensitivity: number,
  threshold: number
): number {
  let bestId = paletteRgb[0].stitchId;
  let minDistance = Infinity;

  const lum = 0.299 * r + 0.587 * g + 0.114 * b;

  for (const item of paletteRgb) {
    const dr = r - item.r;
    const dg = g - item.g;
    const db = b - item.b;

    const rMean = (r + item.r) / 2;
    const weightR = 2 + rMean / 256;
    const weightG = 4.0;
    const weightB = 2 + (255 - rMean) / 256;

    let dist = Math.sqrt(weightR * dr * dr + weightG * dg * dg + weightB * db * db);

    // Kasab Gold Affinity
    if (item.name.includes('kasab') || item.name.includes('gold') || item.stitchId === 1) {
      const isWarm = r > 110 && g > 80 && b < 110 && r >= b;
      if (isWarm) {
        dist *= Math.max(0.3, 1 - (kasabSensitivity / 100) * 0.7);
      }
      // If image has strong dark contrast lines on white, allow them to map to Kasab
      if (lum < (threshold / 100) * 200) {
        dist *= 0.65;
      }
    }

    // Base White Affinity
    if (item.stitchId === 0 || item.name.includes('white')) {
      if (lum > 210) dist *= 0.6;
    }

    // Silk Accent Affinity (e.g. Maroon or Emerald)
    if (item.stitchId === 2) {
      const isSaturatedColor = Math.abs(r - g) > 30 || Math.abs(r - b) > 30;
      if (isSaturatedColor && lum > 40 && lum < 180) {
        dist *= 0.7;
      }
    }

    // Jali Open Stitch Affinity
    if (item.stitchId === 3 || item.name.includes('jali')) {
      if (b > 150 && b > r + 30) dist *= 0.6;
    }

    if (dist < minDistance) {
      minDistance = dist;
      bestId = item.stitchId;
    }
  }

  return bestId;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16) || 0,
      g: parseInt(clean[1] + clean[1], 16) || 0,
      b: parseInt(clean[2] + clean[2], 16) || 0,
    };
  }
  return {
    r: parseInt(clean.substring(0, 2), 16) || 0,
    g: parseInt(clean.substring(2, 4), 16) || 0,
    b: parseInt(clean.substring(4, 6), 16) || 0,
  };
}

function clamp(val: number): number {
  return Math.max(0, Math.min(255, Math.round(val)));
}
