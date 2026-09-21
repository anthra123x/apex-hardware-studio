import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Activity,
  MousePointer2,
  Settings,
  Gauge,
  ShieldCheck,
  Cpu,
  Wrench,
  LineChart,
  Sun,
  Moon,
  Zap,
} from 'lucide-react'
import { useDiagnosticStore } from '../../stores/diagnostic.store'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: string | number
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export function Sidebar() {
  const theme = useDiagnosticStore((s) => s.theme)
  const setTheme = useDiagnosticStore((s) => s.setTheme)
  const manualResults = useDiagnosticStore((s) => s.manualResults)
  const manualPassedCount = Object.values(manualResults).filter((r) => r.result === 'PASS').length

  const navGroups: NavGroup[] = [
    {
      title: 'Diagnóstico',
      items: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/diagnostic/auto', icon: Activity, label: 'Auto Diagnóstico' },
        {
          to: '/diagnostic/manual',
          icon: MousePointer2,
          label: 'Pruebas Manuales',
          badge: manualPassedCount > 0 ? `${manualPassedCount}/9` : undefined,
        },
      ],
    },
    {
      title: 'Rendimiento',
      items: [
        { to: '/performance', icon: LineChart, label: 'Monitor en Vivo' },
        { to: '/benchmark', icon: Gauge, label: 'Benchmark Suite' },
      ],
    },
    {
      title: 'Mantenimiento',
      items: [
        { to: '/drivers', icon: Cpu, label: 'Controladores' },
        { to: '/activation', icon: ShieldCheck, label: 'Activación' },
        { to: '/repair', icon: Wrench, label: 'Reparación S.O.' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { to: '/settings', icon: Settings, label: 'Configuración' },
      ],
    },
  ]

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col h-full flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-white font-black text-base tracking-wider leading-none">APEX</h1>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded">
                v2.0
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-semibold tracking-widest uppercase mt-1">
              Hardware Studio
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {group.title}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-900/40 ring-1 ring-cyan-400/30 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <item.icon className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer Controls */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-medium transition-colors border border-slate-700/50"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Oscuro</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>LISTO</span>
        </div>
      </div>
    </aside>
  )
}
