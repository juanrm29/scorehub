'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { companies } from '@/lib/data';
import { getCompanyStatus, getCompanyCurrentScore, getCompanyCurrentLevel, getLevelColor, getLevelEmoji } from '@/lib/scoring';
import {
  Search, Command, CornerDownLeft, ArrowUp, ArrowDown,
  Building2, FileText, LayoutDashboard, Calculator, Database,
  SlidersHorizontal, BarChart3, X, Sparkles, Hash, Anchor,
} from 'lucide-react';
import { ClientLevel } from '@/lib/types';

// ==================== TYPES ====================
interface SearchResult {
  id: string;
  type: 'company' | 'project' | 'page';
  title: string;
  subtitle: string;
  href: string;
  score?: number;
  level?: ClientLevel;
  icon: React.ElementType;
  color: string;
  tags?: string[];
}

// ==================== BUILD INDEX ====================
function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  // Pages
  const pages = [
    { title: 'Dashboard', subtitle: 'Analytics & overview', href: '/', icon: LayoutDashboard, color: '#3b82f6' },
    { title: 'Calculator & Input', subtitle: 'Score calculator & assessment input', href: '/calculator', icon: Calculator, color: '#8b5cf6' },
    { title: 'Scoring View', subtitle: 'All scores & project list', href: '/scoring', icon: BarChart3, color: '#06b6d4' },
    { title: 'Data Master', subtitle: 'Company database', href: '/data-master', icon: Database, color: '#10b981' },
    { title: 'Parameter', subtitle: 'Scoring parameter reference', href: '/parameter', icon: SlidersHorizontal, color: '#f59e0b' },
    { title: 'Workload Calculator', subtitle: 'Naval architecture estimation engine', href: '/workload', icon: Anchor, color: '#f43f5e' },
  ];
  pages.forEach(p => results.push({ id: `page-${p.href}`, type: 'page', ...p, tags: [] }));

  // Companies & Projects
  companies.forEach(c => {
    const status = getCompanyStatus(c);
    const score = getCompanyCurrentScore(c);
    const level = getCompanyCurrentLevel(c);

    results.push({
      id: `company-${c.id}`,
      type: 'company',
      title: c.companyName,
      subtitle: `${c.location} · Fleet ${c.fleetSize} · ${status === 'NEW_ONLY' ? '🆕 New' : status === 'ACTIVE_REPEATED' ? '🔄 Repeated' : '⏰ Lapsed'}`,
      href: `/company/${c.id}`,
      score,
      level,
      icon: Building2,
      color: getLevelColor(level),
      tags: [c.location, c.industry, status, level],
    });

    // New assessments as projects
    c.newAssessments.forEach(a => {
      results.push({
        id: `project-${a.id}`,
        type: 'project',
        title: a.projectName,
        subtitle: `${c.companyName} · NEW · ${a.date} · Score ${a.scores.totalScore.toFixed(2)}`,
        href: `/company/${c.id}`,
        score: a.scores.totalScore,
        level: a.scores.level,
        icon: FileText,
        color: '#06b6d4',
        tags: [c.companyName, 'new', a.date],
      });
    });

    // Repeated assessments as projects
    c.repeatedAssessments.forEach(a => {
      results.push({
        id: `project-${a.id}`,
        type: 'project',
        title: a.projectName,
        subtitle: `${c.companyName} · REPEATED · ${a.date} · Score ${a.scores.totalScore.toFixed(2)}`,
        href: `/company/${c.id}`,
        score: a.scores.totalScore,
        level: a.scores.level,
        icon: FileText,
        color: '#8b5cf6',
        tags: [c.companyName, 'repeated', a.date],
      });
    });
  });

  return results;
}

// ==================== FUZZY SEARCH ====================
function fuzzyMatch(text: string, query: string): { match: boolean; score: number } {
  const t = text.toLowerCase();
  const q = query.toLowerCase();

  // Exact substring = highest score
  if (t.includes(q)) return { match: true, score: 100 - t.indexOf(q) };

  // Word match
  const words = q.split(/\s+/);
  const allWordsMatch = words.every(w => t.includes(w));
  if (allWordsMatch) return { match: true, score: 50 };

  // Fuzzy character match
  let qi = 0;
  let consecutive = 0;
  let maxConsecutive = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 0;
    }
  }
  if (qi === q.length) return { match: true, score: 10 + maxConsecutive * 5 };

  return { match: false, score: 0 };
}

// ==================== COMPONENT ====================
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const index = useMemo(() => buildSearchIndex(), []);

  // Filter & rank results
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show pages + top companies when empty
      const pages = index.filter(r => r.type === 'page');
      const topCompanies = index
        .filter(r => r.type === 'company')
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 8);
      return [...pages, ...topCompanies];
    }

    return index
      .map(r => {
        const titleMatch = fuzzyMatch(r.title, query);
        const subtitleMatch = fuzzyMatch(r.subtitle, query);
        const tagMatch = r.tags?.some(t => fuzzyMatch(t, query).match) ? 20 : 0;
        const bestScore = Math.max(titleMatch.score, subtitleMatch.score * 0.7) + tagMatch;
        return { ...r, matchScore: bestScore, matched: titleMatch.match || subtitleMatch.match || tagMatch > 0 };
      })
      .filter(r => r.matched)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 15);
  }, [query, index]);

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.children[activeIndex] as HTMLElement;
    if (active) active.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const navigate = useCallback((result: SearchResult) => {
    setOpen(false);
    router.push(result.href);
  }, [router]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      navigate(results[activeIndex]);
    }
  }, [results, activeIndex, navigate]);

  // Reset active index when results change
  useEffect(() => { setActiveIndex(0); }, [results]);

  // Group results by type
  const grouped = useMemo(() => {
    const groups: { type: string; label: string; items: typeof results }[] = [];
    const pages = results.filter(r => r.type === 'page');
    const comps = results.filter(r => r.type === 'company');
    const projs = results.filter(r => r.type === 'project');
    if (pages.length) groups.push({ type: 'page', label: 'Pages', items: pages });
    if (comps.length) groups.push({ type: 'company', label: 'Companies', items: comps });
    if (projs.length) groups.push({ type: 'project', label: 'Projects', items: projs });
    return groups;
  }, [results]);

  // Flat list for keyboard nav
  const flatResults = grouped.flatMap(g => g.items);

  return (
    <>
      {/* Floating Search Trigger — top right of main content */}
      <div className="fixed top-5 right-8 z-50">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm transition-all duration-300 group"
          style={{
            background: 'linear-gradient(135deg, rgba(15,15,25,0.85), rgba(20,20,35,0.85))',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 40px rgba(99,102,241,0.04)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Search className="w-4 h-4 text-[#555] group-hover:text-blue-400 transition-colors" />
          <span className="text-xs text-[#555] group-hover:text-[#888] transition-colors w-40 text-left">Search anything...</span>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-[#555] font-mono">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="fixed z-[101] top-[15%] left-1/2 -translate-x-1/2 w-[640px] max-h-[70vh] rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(15,15,25,0.98), rgba(10,10,18,0.98))',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 25px 50px rgba(0,0,0,0.5), 0 0 100px rgba(99,102,241,0.05)',
              }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
                <Search className="w-5 h-5 text-[#555] shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search companies, projects, pages..."
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-[#444] caret-blue-400"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-[#555] hover:text-[#999] transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="flex items-center px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-[#555] font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="overflow-y-auto max-h-[50vh] p-2">
                {flatResults.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-[#444]">
                    <Sparkles className="w-8 h-8 mb-3 opacity-30" />
                    <p className="text-sm font-medium">No results found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                ) : (
                  grouped.map(group => {
                    return (
                      <div key={group.type}>
                        <p className="text-[10px] font-bold text-[#444] uppercase tracking-[0.15em] px-3 py-2 mt-1">
                          {group.label}
                          <span className="ml-2 text-[#333]">({group.items.length})</span>
                        </p>
                        {group.items.map(result => {
                          const globalIdx = flatResults.indexOf(result);
                          const isActive = globalIdx === activeIndex;
                          const Icon = result.icon;
                          return (
                            <button
                              key={result.id}
                              onClick={() => navigate(result)}
                              onMouseEnter={() => setActiveIndex(globalIdx)}
                              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 group/item ${
                                isActive
                                  ? 'bg-white/[0.06] border border-white/[0.08]'
                                  : 'border border-transparent hover:bg-white/[0.03]'
                              }`}
                            >
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                                style={{
                                  background: isActive ? `${result.color}15` : 'rgba(255,255,255,0.02)',
                                  boxShadow: isActive ? `0 0 12px ${result.color}10` : 'none',
                                }}
                              >
                                <Icon className="w-4 h-4" style={{ color: isActive ? result.color : '#666' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate transition-colors ${isActive ? 'text-white' : 'text-[#ccc]'}`}>
                                  {result.title}
                                </p>
                                <p className="text-[11px] text-[#555] truncate mt-0.5">
                                  {result.subtitle}
                                </p>
                              </div>
                              {result.score !== undefined && (
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-mono font-bold" style={{ color: result.level ? getLevelColor(result.level) : '#666' }}>
                                    {result.score.toFixed(2)}
                                  </span>
                                  {result.level && (
                                    <p className="text-[9px] mt-0.5" style={{ color: getLevelColor(result.level) }}>
                                      {getLevelEmoji(result.level)} {result.level.replace('_', ' ')}
                                    </p>
                                  )}
                                </div>
                              )}
                              {isActive && (
                                <div className="shrink-0 ml-1">
                                  <CornerDownLeft className="w-3.5 h-3.5 text-[#555]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] text-[10px] text-[#444]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> Navigate</span>
                  <span className="flex items-center gap-1"><CornerDownLeft className="w-3 h-3" /> Open</span>
                  <span className="flex items-center gap-1"><span className="font-mono text-[9px] px-1 py-0.5 rounded bg-white/[0.04]">ESC</span> Close</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3" />
                  <span>{flatResults.length} results</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
