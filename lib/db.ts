import { createClient, Client } from '@libsql/client';
import { Pattern } from './types';
import { seedPatterns } from './seeds';

let dbClient: Client | null = null;
let initialized = false;

export function getDb(): Client {
  if (!dbClient) {
    const isVercel = Boolean(process.env.VERCEL);
    const defaultUrl = isVercel ? 'file:/tmp/topi.db' : 'file:topi.db';
    const url = process.env.TURSO_DATABASE_URL || defaultUrl;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    dbClient = createClient({
      url,
      authToken,
    });
  }
  return dbClient;
}

export async function initDb(): Promise<void> {
  if (initialized) return;

  const db = getDb();

  // Create core patterns table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
      head_size_inches REAL NOT NULL DEFAULT 21.0,
      gauge_sts_per_inch REAL NOT NULL DEFAULT 10.0,
      crown_grid TEXT NOT NULL,
      kinar_grid TEXT NOT NULL,
      color_palette TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    );
  `);

  // Try creating FTS5 virtual table and triggers (with graceful fallback if FTS5 not built into SQLite binary)
  try {
    await db.execute(`
      CREATE VIRTUAL TABLE IF NOT EXISTS patterns_fts USING fts5(
        title,
        description,
        content='patterns',
        content_rowid='rowid'
      );
    `);

    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS patterns_ai AFTER INSERT ON patterns BEGIN
        INSERT INTO patterns_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
      END;
    `);

    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS patterns_ad AFTER DELETE ON patterns BEGIN
        INSERT INTO patterns_fts(patterns_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
      END;
    `);

    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS patterns_au AFTER UPDATE ON patterns BEGIN
        INSERT INTO patterns_fts(patterns_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
        INSERT INTO patterns_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
      END;
    `);
  } catch (err) {
    console.warn('FTS5 initialization notice (standard search fallback enabled):', err);
  }

  initialized = true;

  // Check if we need to populate seed data
  const countResult = await db.execute('SELECT COUNT(*) as count FROM patterns');
  const count = Number(countResult.rows[0]?.count || 0);

  if (count === 0) {
    for (const p of seedPatterns) {
      await savePattern(p);
    }
  }
}

export async function getAllPatterns(searchQuery?: string): Promise<Pattern[]> {
  await initDb();
  const db = getDb();

  let rows;

  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.trim();
    try {
      // Try FTS5 MATCH query first
      const ftsQuery = q.includes('*') ? q : `${q}*`;
      const ftsResult = await db.execute({
        sql: `
          SELECT p.* FROM patterns p
          JOIN patterns_fts f ON p.rowid = f.rowid
          WHERE patterns_fts MATCH ?
          ORDER BY p.updated_at DESC
        `,
        args: [ftsQuery],
      });
      rows = ftsResult.rows;
    } catch {
      // Fallback to standard LIKE search
      const likeResult = await db.execute({
        sql: `
          SELECT * FROM patterns
          WHERE title LIKE ? OR description LIKE ?
          ORDER BY updated_at DESC
        `,
        args: [`%${q}%`, `%${q}%`],
      });
      rows = likeResult.rows;
    }
  } else {
    const result = await db.execute('SELECT * FROM patterns ORDER BY updated_at DESC');
    rows = result.rows;
  }

  return rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    description: String(r.description || ''),
    difficulty_level: (r.difficulty_level as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
    head_size_inches: Number(r.head_size_inches),
    gauge_sts_per_inch: Number(r.gauge_sts_per_inch),
    crown_grid: typeof r.crown_grid === 'string' ? JSON.parse(r.crown_grid) : r.crown_grid,
    kinar_grid: typeof r.kinar_grid === 'string' ? JSON.parse(r.kinar_grid) : r.kinar_grid,
    color_palette: typeof r.color_palette === 'string' ? JSON.parse(r.color_palette) : r.color_palette,
    created_at: Number(r.created_at),
    updated_at: Number(r.updated_at),
  }));
}

export async function getPatternById(id: string): Promise<Pattern | null> {
  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM patterns WHERE id = ?',
    args: [id],
  });

  if (!result.rows.length) return null;
  const r = result.rows[0];

  return {
    id: String(r.id),
    title: String(r.title),
    description: String(r.description || ''),
    difficulty_level: (r.difficulty_level as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
    head_size_inches: Number(r.head_size_inches),
    gauge_sts_per_inch: Number(r.gauge_sts_per_inch),
    crown_grid: typeof r.crown_grid === 'string' ? JSON.parse(r.crown_grid as string) : r.crown_grid,
    kinar_grid: typeof r.kinar_grid === 'string' ? JSON.parse(r.kinar_grid as string) : r.kinar_grid,
    color_palette: typeof r.color_palette === 'string' ? JSON.parse(r.color_palette as string) : r.color_palette,
    created_at: Number(r.created_at),
    updated_at: Number(r.updated_at),
  } as Pattern;
}

export async function savePattern(pattern: Pattern): Promise<void> {
  await initDb();
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  await db.execute({
    sql: `
      INSERT INTO patterns (id, title, description, difficulty_level, head_size_inches, gauge_sts_per_inch, crown_grid, kinar_grid, color_palette, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        difficulty_level = excluded.difficulty_level,
        head_size_inches = excluded.head_size_inches,
        gauge_sts_per_inch = excluded.gauge_sts_per_inch,
        crown_grid = excluded.crown_grid,
        kinar_grid = excluded.kinar_grid,
        color_palette = excluded.color_palette,
        updated_at = excluded.updated_at
    `,
    args: [
      pattern.id,
      pattern.title,
      pattern.description || '',
      pattern.difficulty_level || 'intermediate',
      pattern.head_size_inches || 21.0,
      pattern.gauge_sts_per_inch || 10.0,
      JSON.stringify(pattern.crown_grid),
      JSON.stringify(pattern.kinar_grid),
      JSON.stringify(pattern.color_palette),
      pattern.created_at || now,
      now,
    ],
  });
}

export async function deletePattern(id: string): Promise<void> {
  await initDb();
  const db = getDb();
  await db.execute({
    sql: 'DELETE FROM patterns WHERE id = ?',
    args: [id],
  });
}
