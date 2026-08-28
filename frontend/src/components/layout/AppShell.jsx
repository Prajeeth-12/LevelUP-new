import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Layers3, ListTodo, Lightbulb,
  BarChart3, Settings, Zap, LogOut,
  ChevronLeft, Menu, User, Award, SunMoon, Compass, Sparkles,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase'
import { useTheme } from '../../contexts/ThemeContext'
import { getAuth } from 'firebase/auth'
import { AIChatButton } from '../chat/AIChatButton'
import { AIChatDrawer } from '../chat/AIChatDrawer'

// ─── Navigation config ──────────────────────────────────────────────────────
const NAV_MAIN = [
  { to: '/dashboard',     label: 'Home',             icon: LayoutDashboard },
  { to: '/learning-path', label: 'AI Learning Path', icon: Compass },
  { to: '/tasks',         label: 'Tasks',            icon: ListTodo },
  { to: '/skills',        label: 'Skills',           icon: Layers3 },
  { to: '/goals',         label: 'Goals',            icon: Lightbulb },
  { to: '/portfolio',     label: 'Portfolio',        icon: Award },
  { to: '/analytics',     label: 'Analytics',        icon: BarChart3 },
]

const NAV_BOTTOM = [
  { to: '/profile',  label: 'Profile',  icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
]

// ─── Mobile Bottom Bar (shown on <768px) ────────────────────────────────────
const MOBILE_TABS = [
  { to: '/dashboard', label: 'Home',      icon: LayoutDashboard },
  { to: '/tasks',     label: 'Tasks',     icon: ListTodo },
  { to: '/skills',    label: 'Skills',    icon: Layers3 },
  { to: '/portfolio', label: 'Portfolio', icon: Award },
  { to: '/goals',     label: 'Goals',     icon: Lightbulb },
]

// ─── Sidebar NavItem ─────────────────────────────────────────────────────────
const SideNavItem = ({ item, collapsed }) => {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-2xl font-medium text-xs sm:text-sm transition-all ${
          isActive
            ? 'bg-card text-foreground font-semibold border border-border shadow-2xs'
            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
        } ${collapsed ? 'justify-center px-0 py-2.5' : ''}`
      }
    >
      <Icon className="shrink-0" style={{ width: 17, height: 17 }} />
      {!collapsed && <span className="tracking-tight">{item.label}</span>}
    </NavLink>
  )
}

// ─── AppShell ────────────────────────────────────────────────────────────────
export const AppShell = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const firebaseAuth = getAuth()
  const { theme, toggleTheme } = useTheme()

  const [collapsed, setCollapsed]       = useState(false)
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [scrolled, setScrolled]         = useState(false)
  const [chatOpen, setChatOpen]         = useState(false)

  // Global Ctrl + / or Cmd + / shortcut to toggle AI Chatbot
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === '?')) {
        e.preventDefault()
        setChatOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const userEmail = firebaseAuth.currentUser?.email || ''
  const userName  = firebaseAuth.currentUser?.displayName || userEmail.split('@')[0] || 'Engineer'
  const userInit  = userName.charAt(0).toUpperCase()

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  const pagePathName = (() => {
    const map = {
      '/dashboard': 'home',
      '/skills':    'skills',
      '/portfolio': 'portfolio',
      '/tasks':     'tasks',
      '/goals':     'goals',
      '/analytics': 'analytics',
      '/settings':  'settings',
      '/profile':   'profile',
      '/skill-gap':     'skill-gap',
      '/learning-path': 'learning-path',
    }
    return map[location.pathname] || location.pathname.replace('/', '') || 'home'
  })()

  return (
    <div className="app-shell bg-background min-h-screen">

      {/* ── Mobile Overlay ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Layrs Rail Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`app-sidebar
          ${collapsed ? 'collapsed' : ''}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-all duration-200 ease-in-out border-r border-border bg-card/95 backdrop-blur-xl
        `}
      >
        {/* Rail Header */}
        <div className={`flex items-center px-4 border-b border-border/80 shrink-0
          ${collapsed ? 'justify-center py-3' : 'justify-between py-3'}`}
          style={{ height: 'var(--topbar-h)' }}
        >
          {!collapsed && (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs font-bold text-sm">
                L
              </div>
              <div className="text-left">
                <span className="font-extrabold text-sm tracking-tight text-foreground">
                  Layrs <span className="text-orange-600 dark:text-orange-400 font-serif italic font-normal text-xs">LevelUP</span>
                </span>
              </div>
            </button>
          )}

          {collapsed && (
            <div
              className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center cursor-pointer shadow-xs font-bold text-sm"
              onClick={() => navigate('/dashboard')}
            >
              L
            </div>
          )}

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors hidden lg:flex"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Button: New Session / New Task */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <button
              onClick={() => navigate('/tasks')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold border border-border transition-all shadow-2xs"
            >
              <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">+</span>
              <span>New Task / Plan</span>
            </button>
          </div>
        )}

        {/* Rail Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV_MAIN.map((item) => (
            <SideNavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Rail Footer */}
        <div className="px-3 pb-3 pt-2 border-t border-border/80 space-y-1.5">
          {/* Ask AI prompt chip in sidebar */}
          {!collapsed && (
            <button
              onClick={() => setChatOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Tutor</span>
            </button>
          )}

          {NAV_BOTTOM.map((item) => (
            <SideNavItem key={item.to} item={item} collapsed={collapsed} />
          ))}

          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign out' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-medium text-destructive hover:bg-destructive/10 w-full text-left transition-colors ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut style={{ width: 16, height: 16 }} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Layout Column ───────────────────────────────────────────── */}
      <div className={`flex flex-col flex-1 min-h-screen transition-all duration-200
        ${collapsed ? 'md:ml-18' : 'md:ml-62'}`}
      >
        {/* Topbar with Layrs Breadcrumb */}
        <header className={`sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-[3.75rem] bg-background/90 backdrop-blur-md border-b border-border ${scrolled ? 'shadow-2xs' : ''}`}>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Expand sidebar (desktop, when collapsed) */}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary hidden md:flex"
              title="Expand sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Layrs Breadcrumbs */}
          <div className="flex-1 min-w-0 flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="text-muted-foreground/60 cursor-pointer hover:text-foreground" onClick={() => navigate('/dashboard')}>
              home
            </span>
            {pagePathName !== 'home' && (
              <>
                <span className="text-muted-foreground/40 font-mono">/</span>
                <span className="font-bold text-foreground tracking-tight">
                  {pagePathName}
                </span>
              </>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Ask AI Assistant quick button */}
            <button
              onClick={() => setChatOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition-all"
              title="Open AI Assistant (Ctrl + /)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>

            {/* Theme Toggle (Layrs Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground bg-secondary/80 border border-border hover:text-foreground hover:bg-secondary transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <SunMoon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{theme === 'light' ? 'Light' : 'Dark'}</span>
            </button>

            {/* Avatar */}
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-secondary border border-border text-foreground font-bold text-xs flex items-center justify-center hover:border-orange-500/50 transition-colors"
              title={userName}
            >
              {userInit}
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Bar ────────────────────────────────────────────── */}
      <nav className="mobile-bottom-bar md:hidden">
        {MOBILE_TABS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon style={{ width: 20, height: 20 }} />
              <span style={{ fontSize: '10px' }}>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* ── Floating AI Assistant Launcher & Drawer ───────────────────────── */}
      <AIChatButton onClick={() => setChatOpen(true)} isOpen={chatOpen} />
      <AIChatDrawer isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

export default AppShell
