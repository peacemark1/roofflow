import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import {
  LayoutDashboard, FileText, Users,
  Settings, LogOut, Home, ChevronRight
} from 'lucide-react'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/quotes',    icon: FileText,         label: 'Quotes'    },
  { to: '/clients',   icon: Users,            label: 'Clients'   },
  { to: '/settings',  icon: Settings,         label: 'Settings'  },
]

export function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate  = useNavigate()
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.fromTo(sidebarRef.current,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
    )
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside ref={sidebarRef} className="w-60 bg-white border-r border-gray-100 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-gray-900 leading-none">RoofFlow</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Roofing Systems</p>
            </div>
          </div>
        </div>

        {/* Company name */}
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">Company</p>
          <p className="text-sm font-medium text-gray-700 truncate">
            {user?.company_id ? 'Kinkok Roofing' : '—'}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
               ${isActive
                 ? 'bg-brand-50 text-brand-500'
                 : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
               }`
            }>
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-brand-500' : 'text-gray-400'} />
                  {label}
                  {isActive && <ChevronRight size={14} className="ml-auto text-brand-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                       text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all mt-1">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
