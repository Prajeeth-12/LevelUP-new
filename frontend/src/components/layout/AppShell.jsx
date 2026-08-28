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
  { to: '/dashboard',     label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/learning-path', label: 'AI Learning Path', icon: Compass },
  { to: '/skills',        label: 'Skills',           icon: Layers3 },
  { to: '/portfolio',     label: 'Portfolio',        icon: Award },
  { to: '/tasks',         label: 'Tasks',            icon: ListTodo },
  { to: '/goals',         label: 'Goals',            icon: Lightbulb },
  { to: '/analytics',     label: 'Analytics',        icon: BarChart3 },
]

const NAV_BOTTOM = [
  { to: '/profile',  label: 'Profile',  icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
]

// ─── Mobile Bottom Bar (shown on <768px) ────────────────────────────────────
const MOBILE_TABS = [
  { to: '/dashboard', label: 'Home',      icon: LayoutDashboard },
  { to: '/skills',    label: 'Skills',    icon: Layers3 },
  { to: '/portfolio', label: 'Portfolio', icon: Award },
  { to: '/tasks',     label: 'Tasks',     icon: ListTodo },
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
        `nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
      }
    >
      <Icon className="shrink-0" style={{ width: 18, height: 18 }} />
      {!collapsed && <span>{item.label}</span>}
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
  const userName  = firebaseAuth.currentUser?.displayName || userEmail.split('@')[0] || 'User'
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

  const pageTitle = (() => {
    const map = {
      '/dashboard': 'Dashboard',
      '/skills':    'Skills',
      '/portfolio': 'Portfolio',
      '/tasks':     'Tasks',
      '/goals':     'Goals',
      '/analytics': 'Analytics',
      '/settings':  'Settings',
      '/profile':   'Profile',
      '/skill-gap':     'Skill Gap Analyzer',
      '/learning-path': 'AI Learning Path Recommender',
    }
    return map[location.pathname] || 'LevelUP'
  })()

  return (
    <div className="app-shell bg-background">

      {/* ── Mobile Overlay ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`app-sidebar
          ${collapsed ? 'collapsed' : ''}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-all duration-300 ease-in-out
        `}
      >
        {/* Sidebar header */}
        <div className={`flex items-center gap-3 px-4 border-b border-border/5 shrink-0
          ${collapsed ? 'justify-center py-4' : 'justify-between py-4'}`}
          style={{ height: 'var(--topbar-h)' }}
        >
          {!collapsed && (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center shadow-lg border border-black">
                <Zap className="w-5 h-5 fill-white stroke-white" />
              </div>
            </button>
          )}
          {collapsed && (
            <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center cursor-pointer border border-black shadow-lg"
              onClick={() => navigate('/dashboard')}>
              <Zap className="w-5 h-5 fill-white stroke-white" />
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="btn-icon hidden lg:flex"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sidebar nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* Skill Gap shortcut */}
          <NavLink
            to="/skill-gap"
            title={collapsed ? 'Skill Gap Analyzer' : undefined}
            className={({ isActive }) =>
              `nav-item mb-3 ${isActive ? 'active' : ''}
               ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            <Zap className="shrink-0" style={{ width: 16, height: 16 }} />
            {!collapsed && <span className="font-medium text-xs">AI Skill Gap</span>}
          </NavLink>

          <div className="h-px bg-border mb-3" />

          {NAV_MAIN.map((item) => (
            <SideNavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="px-3 pb-4 pt-2 border-t border-border space-y-1">
          {NAV_BOTTOM.map((item) => (
            <SideNavItem key={item.to} item={item} collapsed={collapsed} />
          ))}

          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign out' : undefined}
            className={`nav-item w-full text-left text-destructive
              hover:bg-destructive/10 hover:text-destructive
              ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut style={{ width: 18, height: 18 }} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className={`flex flex-col flex-1 min-h-screen transition-all duration-300
        ${collapsed ? 'md:ml-16' : 'md:ml-60'}`}
      >
        {/* Top bar */}
        <header className={`app-topbar ${scrolled ? 'shadow-sm' : ''}`}>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-icon md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Expand sidebar (desktop, when collapsed) */}
          {collapsed && (
            <button
            onClick={() => setCollapsed(false)}
            className="btn-icon hidden md:flex"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Page title breadcrumb */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-foreground truncate tracking-[-0.01em]">
              {pageTitle}
            </h1>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* AI Learning Path quick button */}
            <button
              onClick={() => navigate('/learning-path')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[16px]
                text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>AI Learning Path</span>
            </button>

            {/* Skill Gap quick button */}
            <button
              onClick={() => navigate('/skill-gap')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[16px]
                text-xs font-medium bg-card text-foreground border border-border hover:bg-accent transition-colors"
            >
              <Zap className="w-3 h-3" />
              Skill Gap
            </button>

            <button
              onClick={toggleTheme}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[16px] text-xs font-medium text-muted-foreground bg-accent/50 border border-border hover:bg-accent transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <SunMoon className="w-3 h-3" />
              {theme === 'light' ? 'Light mode' : 'Blue mode'}
            </button>

            {/* Avatar */}
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-card text-foreground border border-border
                flex items-center justify-center font-semibold text-xs
                hover:bg-accent transition-colors shrink-0"
              title={userName}
              aria-label="Open profile"
            >
              {userInit}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20 md:pb-6">
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
