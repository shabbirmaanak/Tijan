# Topi Crochet Vector & Grid Pattern Vault

A specialized, edge-first web application for designing, scaling, simulating, and exporting handcrafted **Dawoodi Bohra Topi** crochet patterns.

Built to run on Next.js (App Router), Tailwind CSS, LibSQL / Turso SQLite (with SQLite FTS5 search), HTML5 Canvas / SVG Grid, and high-precision crochet mathematical engines.

---

## Features

- **Domain Rules & Core Math Engines**:
  - **Crown (Chhat) Flatness Validator**: Verifies the strict $+6$ (or $+8$) stitches/round expansion rule ($n \times \text{Base}$) to prevent cupping or ruffling. Includes target crown diameter calculation ($d = C / \pi$).
  - **Size Scaling Engine**: Calculates motif repeats, final columns, actual circumference, and size variance from target head measurement (inches), gauge (sts/in), and base motif width.
  - **Run-Length Encoding (RLE) Crochet Step Compiler**: Compiles 2D stitch grids into clean, row-by-row human-readable crochet patterns with thread totals and yardage estimation.
- **Interactive Kinar (Side Wall) Canvas Editor**:
  - Full cylindrical grid editing mode ($24 \times 210$ stitches) or single motif editing mode ($24 \times 15$ stitches).
  - Drawing tools: Brush / Pencil, Eraser, Flood Fill Bucket, Line tool, Filled Rectangle, Eye-dropper color picker.
  - Zoom controls, grid line toggle, motif divider markers, undo/redo history stack, and matrix shift / flip tools.
- **3D Cylindrical Bohra Topi Preview**:
  - Real-time 3D raycast simulation showing the repeated motif wrapped as a 360° continuous Bohra Topi wall with interactive spin and lighting.
  - Seamless ribbon wallpaper view.
- **SQLite / Turso Vault & FTS5 Search**:
  - Stored in SQLite / Turso using `@libsql/client`.
  - Full-Text Search (FTS5) across pattern titles, descriptions, and stitch metadata.
  - Pre-seeded with 3 classic Bohra Topi motifs:
    1. *7-Line Geometric Kasab* (classic parallel gold bands with stepped chevron peaks)
    2. *Diamond Jali Lattice* (openwork lace with Kasab gold contours and emerald silk accents)
    3. *Floral Chevron Paisley* (stepped floral kasab zigzag with contrasting silk accents)
- **Printable Pattern Sheet & Text Export**:
  - One-click printer-friendly pattern book formatting (`@media print`) and PDF export.
  - Raw text export, JSON import / export, and thread breakdown ledger.

---

## Stitch Key

- **0**: Base Stitch (Single Crochet / White Ecru Cotton)
- **1**: Primary Kasab Gold Metallic Thread (`#D4AF37`)
- **2**: Secondary Silk / Cotton Accent Color (e.g. Maroon `#781D22` or Emerald `#1B4D3E`)
- **3**: Jali (Open Chain Space / Lace)

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration (Optional)
By default, the application runs locally with `file:topi.db`. To connect to a remote Turso database, copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

And set your credentials:
```env
TURSO_DATABASE_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🚀 Deploying to Vercel

The application is edge-ready and built to deploy directly on **Vercel** with **Turso SQLite**:

1. **Import the Repository**:
   - Push your code to GitHub (`https://github.com/shabbirmaanak/Tijan.git`).
   - Go to [vercel.com/new](https://vercel.com/new) and import the repository.
   - Framework preset: **Next.js**.

2. **Configure Environment Variables** (in Vercel Project Settings):
   - `TURSO_DATABASE_URL`: `libsql://your-turso-db.turso.io`
   - `TURSO_AUTH_TOKEN`: `your-turso-jwt-token`

3. **Deploy**:
   - Click **Deploy**. Vercel will build and deploy the Next.js app on edge serverless functions with zero configuration.

---

## Project Structure

```
├── app/
│   ├── api/patterns/         # REST API endpoints (GET list/search, POST save)
│   │   └── [id]/             # Single pattern endpoints (GET, PUT, DELETE)
│   ├── globals.css           # Tailwind directives & print styles
│   ├── layout.tsx            # Root HTML layout
│   └── page.tsx              # Main studio interface
├── components/
│   ├── CraftGuideModal.tsx   # Bohra Topi craft reference & mathematical rules
│   ├── CrownDesigner.tsx     # Concentric Chhat visualizer & flatness validator
│   ├── KinarCanvasEditor.tsx # Interactive HTML5 Canvas grid editor
│   ├── Navbar.tsx            # Top navigation bar & pattern metrics
│   ├── PalettePicker.tsx     # Stitch palette manager & thread counts
│   ├── PatternVaultModal.tsx # FTS5 search vault drawer & import/export
│   ├── PrintExportModal.tsx  # Production pattern sheet & PDF printout
│   ├── SizeScalingModal.tsx  # Circumference & motif scaling dialog
│   └── TilingPreview.tsx     # 3D Bohra Topi cylindrical simulator
├── lib/
│   ├── compiler.ts           # RLE crochet instruction compiler & thread metrics
│   ├── db.ts                 # Turso LibSQL client, auto-migration & FTS5 search
│   ├── scaling.ts            # Size scaling engine & motif tiling
│   ├── schema.sql            # SQLite DDL schema & triggers
│   ├── seeds.ts              # Classic Bohra Topi seed motifs
│   ├── types.ts              # TypeScript interfaces
│   └── validator.ts          # Crown flatness validator (+6/+8 math)
└── scripts/
    ├── test-db-direct.ts     # SQLite / FTS search verification
    └── test-math.mjs         # RLE & scaling unit tests
```
