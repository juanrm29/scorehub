'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calculator, Database, SlidersHorizontal, Waves,
  BarChart3, Anchor, GitCompareArrows, Menu, X,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, color: '#3b82f6' },
  { href: '/calculator', label: 'Calculator & Input', icon: Calculator, color: '#8b5cf6' },
  { href: '/scoring', label: 'Scoring View', icon: BarChart3, color: '#06b6d4' },
  { href: '/compare', label: 'Compare', icon: GitCompareArrows, color: '#ec4899' },
  { href: '/data-master', label: 'Data Master', icon: Database, color: '#10b981' },
  { href: '/parameter', label: 'Parameter', icon: SlidersHorizontal, color: '#f59e0b' },
  { href: '/workload', label: 'Workload Calculator', icon: Anchor, color: '#f43f5e' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  // Close on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Ambient glow */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="relative p-6 lg:p-6 lg:group-hover:p-6 border-b border-white/[0.04] flex items-center lg:justify-center lg:group-hover:justify-start transition-all">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Anchor className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#0c0c14] animate-pulse" />
            </div>
            <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 w-auto lg:w-0 lg:group-hover:w-auto transition-all duration-300 overflow-hidden whitespace-nowrap">
              <h1 className="text-lg font-black text-gradient">ScoreHub</h1>
              <p className="text-[9px] text-[#555] tracking-[0.2em] uppercase font-medium">Maritime Intelligence</p>
            </div>
          </motion.div>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/[0.05] text-[#555] hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        <p className="text-[9px] text-[#444] uppercase tracking-[0.15em] font-bold px-3 lg:px-0 lg:group-hover:px-3 py-2 mt-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 w-auto lg:w-0 lg:group-hover:w-auto transition-all duration-300 whitespace-nowrap overflow-hidden">Navigation</p>
        {navItems.map((item, index) => {
          const isActive = pathname === item.href || (item.href === '/data-master' && pathname.startsWith('/company')) || (item.href === '/scoring' && pathname.startsWith('/scoring'));
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 + 0.2, duration: 0.4 }}
            >
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                  isActive
                    ? 'sidebar-nav-active text-white'
                    : 'text-[#555] hover:text-[#ccc] hover:bg-white/[0.02]'
                }`}
              >
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive ? '' : 'lg:group-hover:scale-110'
                }`} style={isActive ? { background: `${item.color}15`, boxShadow: `0 0 12px ${item.color}15` } : {}}>
                  <Icon className="w-4 h-4 transition-colors" style={{ color: isActive ? item.color : undefined }} />
                </div>
                <span className={`opacity-100 lg:opacity-0 lg:group-hover:opacity-100 w-auto lg:w-0 lg:group-hover:w-auto transition-all duration-300 whitespace-nowrap overflow-hidden ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/[0.04]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-xl p-4 bg-gradient-to-br from-white/[0.02] to-transparent border border-white/[0.04]"
        >
          <div className="flex items-center gap-2 mb-2 justify-center lg:justify-start">
            <Waves className="w-4 h-4 shrink-0 text-cyan-400" />
            <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider opacity-100 lg:opacity-0 lg:group-hover:opacity-100 w-auto lg:w-0 lg:group-hover:w-auto transition-all overflow-hidden whitespace-nowrap">System Status</span>
          </div>
          <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 w-auto lg:w-0 lg:group-hover:w-auto transition-all overflow-hidden">
            <p className="text-[10px] text-[#555] whitespace-nowrap">All systems operational</p>
            <div className="mt-2 h-1 rounded-full bg-white/[0.03] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4, #3b82f6)' }}
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, delay: 0.8 }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[9px] text-[#444]">v2.0 Pro</span>
            <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
          </div>
        </motion.div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-5 left-5 z-50 lg:hidden p-2.5 rounded-2xl transition-all duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,25,0.9), rgba(20,20,35,0.9))',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Menu className="w-5 h-5 text-[#888]" />
      </button>

      {/* Desktop Sidebar — floating dock */}
      <aside className="hidden lg:flex fixed left-4 top-4 bottom-4 w-[88px] hover:w-[280px] glass-strong flex-col z-50 overflow-hidden rounded-2xl border border-white/10 group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl shadow-black/50">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar — overlay drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-72 glass-strong flex flex-col z-[70] overflow-hidden lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
