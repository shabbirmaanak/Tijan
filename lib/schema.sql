-- Schema for Bohra Topi Crochet Vault
CREATE TABLE IF NOT EXISTS patterns (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'intermediate',
    head_size_inches REAL NOT NULL DEFAULT 21.0,
    gauge_sts_per_inch REAL NOT NULL DEFAULT 10.0,
    crown_grid JSON NOT NULL,
    kinar_grid JSON NOT NULL,
    color_palette JSON NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);

-- SQLite FTS5 Full-Text Search
CREATE VIRTUAL TABLE IF NOT EXISTS patterns_fts USING fts5(
    title,
    description,
    content='patterns',
    content_rowid='rowid'
);

-- FTS Synchronization Triggers
CREATE TRIGGER IF NOT EXISTS patterns_ai AFTER INSERT ON patterns BEGIN
    INSERT INTO patterns_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;

CREATE TRIGGER IF NOT EXISTS patterns_ad AFTER DELETE ON patterns BEGIN
    INSERT INTO patterns_fts(patterns_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
END;

CREATE TRIGGER IF NOT EXISTS patterns_au AFTER UPDATE ON patterns BEGIN
    INSERT INTO patterns_fts(patterns_fts, rowid, title, description) VALUES('delete', old.rowid, old.title, old.description);
    INSERT INTO patterns_fts(rowid, title, description) VALUES (new.rowid, new.title, new.description);
END;
