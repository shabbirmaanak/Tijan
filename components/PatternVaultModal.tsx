'use client';

import React, { useState, useEffect } from 'react';
import { Pattern } from '@/lib/types';
import {
  FolderOpen,
  Search,
  Plus,
  Trash2,
  Copy,
  Upload,
  Sparkles,
  X,
  Layers,
  Calendar,
  Ruler,
} from 'lucide-react';

interface PatternVaultModalProps {
  currentPatternId: string;
  onSelectPattern: (pattern: Pattern) => void;
  onNewPattern: () => void;
  onClose: () => void;
}

export const PatternVaultModal: React.FC<PatternVaultModalProps> = ({
  currentPatternId,
  onSelectPattern,
  onNewPattern,
  onClose,
}) => {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchPatterns = async (q?: string) => {
    setIsLoading(true);
    try {
      const url = q ? `/api/patterns?q=${encodeURIComponent(q)}` : '/api/patterns';
      const res = await fetch(url);
      const data = await res.json();
      if (data.patterns) {
        setPatterns(data.patterns);
      }
    } catch (err) {
      console.error('Error fetching vault patterns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatterns(searchQuery);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this pattern from the vault?')) return;
    try {
      const res = await fetch(`/api/patterns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPatterns((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Error deleting pattern:', err);
    }
  };

  const handleClone = async (pattern: Pattern, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned: Pattern = {
      ...pattern,
      id: `topi-${Date.now()}`,
      title: `${pattern.title} (Copy)`,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    };

    try {
      const res = await fetch('/api/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloned),
      });
      if (res.ok) {
        setPatterns((prev) => [cloned, ...prev]);
        onSelectPattern(cloned);
        onClose();
      }
    } catch (err) {
      console.error('Error cloning pattern:', err);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string) as Pattern;
        if (!json.title || !json.kinar_grid) {
          alert('Invalid pattern JSON file.');
          return;
        }
        json.id = json.id || `topi-${Date.now()}`;
        const res = await fetch('/api/patterns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        });
        if (res.ok) {
          setPatterns((prev) => [json, ...prev]);
          onSelectPattern(json);
          onClose();
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const filteredPatterns = patterns.filter((p) => {
    if (selectedDifficulty === 'all') return true;
    return p.difficulty_level === selectedDifficulty;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-bohra-border shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 border-b border-bohra-border bg-bohra-paper/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gold-50 border border-gold-200 rounded-xl">
              <FolderOpen className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-bohra-text">
                Topi Pattern Vault (SQLite / Turso)
              </h3>
              <p className="text-xs text-bohra-muted">
                FTS5 indexed repository of authentic Bohra Topi designs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white hover:bg-gold-50 border border-bohra-border rounded-lg text-bohra-text cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-gold-600" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                onNewPattern();
                onClose();
              }}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Pattern</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-bohra-muted hover:text-bohra-text rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-bohra-border flex flex-col sm:flex-row items-center gap-3 bg-white">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-bohra-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search motifs, titles, geometric patterns (FTS5)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === '') fetchPatterns('');
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-bohra-border rounded-lg bg-bohra-paper/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </form>

          {/* Difficulty Filter Tabs */}
          <div className="flex items-center bg-bohra-paper rounded-lg border border-bohra-border p-0.5 text-xs shrink-0">
            {['all', 'beginner', 'intermediate', 'advanced'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedDifficulty(lvl)}
                className={`px-2.5 py-1 rounded capitalize transition-colors ${
                  selectedDifficulty === lvl
                    ? 'bg-gold-500 text-white font-bold shadow-sm'
                    : 'text-bohra-muted hover:text-bohra-text'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Pattern List */}
        <div className="flex-1 overflow-y-auto p-4 bg-bohra-paper/20 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-bohra-muted">
              Loading patterns from vault...
            </div>
          ) : filteredPatterns.length === 0 ? (
            <div className="py-12 text-center text-xs text-bohra-muted">
              No patterns found matching your search.
            </div>
          ) : (
            filteredPatterns.map((p) => {
              const isSelected = p.id === currentPatternId;
              const rows = p.kinar_grid?.length || 0;
              const cols = p.kinar_grid?.[0]?.length || 0;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPattern(p);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-gold-500 ring-2 ring-gold-200 shadow-md'
                      : 'border-bohra-border hover:border-gold-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-bohra-text">
                          {p.title}
                        </h4>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.2 rounded-full border ${
                            p.difficulty_level === 'beginner'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.difficulty_level === 'advanced'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {p.difficulty_level}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] bg-gold-100 text-gold-800 font-bold px-2 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-bohra-muted line-clamp-2 mb-2">
                        {p.description || 'Traditional handcrafted Bohra Topi design.'}
                      </p>

                      <div className="flex items-center flex-wrap gap-3 text-[11px] text-bohra-muted font-mono">
                        <span className="flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-gold-600" />
                          {p.head_size_inches}&quot; ({p.gauge_sts_per_inch} sts/in)
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-gold-600" />
                          {rows}R × {cols}C ({rows * cols} sts)
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleClone(p, e)}
                        className="p-1.5 text-bohra-muted hover:text-bohra-text hover:bg-bohra-paper rounded-lg"
                        title="Duplicate Pattern"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(p.id, e)}
                        className="p-1.5 text-bohra-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Delete Pattern"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
