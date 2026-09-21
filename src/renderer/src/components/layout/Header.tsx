import { useLocation } from 'react-router-dom'
import { useDiagnosticStore } from '../../stores/diagnostic.store'
import { Monitor, Clock, ChevronDown, Activity } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useIpc } from '../../hooks/useIpc'
import { IPC_CHANNELS } from '../../../../shared/constants/ipc-channels'
import { SystemSpecsModal } from './SystemSpecsModal'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard Principal',
  '/diagnostic/auto': 'Diagnóstico Automático Integral',
  '/diagnostic/manual': 'Centro de Pruebas Manuales',
  '/diagnostic/manual/screen': 'Prueba de Pantalla & Píxeles',
  '/diagnostic/manual/keyboard': 'Prueba de Teclado Físico',
  '/diagnostic/manual/touchpad': 'Prueba de Touchpad & Gestos',
  '/diagnostic/manual/camera': 'Prueba de Cámara & Video',
  '/diagnostic/manual/mic': 'Prueba de Micrófono & Captura',
  '/diagnostic/manual/audio': 'Prueba de Audio Estéreo (L/R)',
  '/diagnostic/manual/wifi': 'Prueba de Conectividad WiFi',
  '/diagnostic/manual/bluetooth': 'Prueba de Adaptador Bluetooth',
  '/diagnostic/manual/usb': 'Prueba de Puertos & Periféricos USB',
  '/performance': 'Monitoreo de Rendimiento en Vivo',
  '/benchmark': 'Benchmark Suite de Rendimiento',
  '/drivers': 'Gestión y Diagnóstico de Controladores',
  '/activation': 'Activación y Licenciamiento de Sistema',
  '/repair': 'Herramientas de Reparación de Windows',
  '/settings': 'Configuración & Preferencias',
}

export function Header() {
  const location = useLocation()
  const systemInfo = useDiagnosticStore((s) => s.systemInfo)
  const setSystemSpecs = useDiagnosticStore((s) => s.setSystemSpecs)
  const setSpecsModalOpen = useDiagnosticStore((s) => s.setSpecsModalOpen)
  const { invoke } = useIpc()
  const [dateTime, setDateTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 10000)
    return () => clearInterval(timer)
  }, [])

  const title = pageTitles[location.pathname] || 'Apex Hardware Studio'

  const handleDeviceClick = () => {
    setSpecsModalOpen(true)
    if (!useDiagnosticStore.getState().systemSpecs) {
      invoke(IPC_CHANNELS.GET_SYSTEM_SPECS).then((specs) => {
        if (specs) setSystemSpecs(specs)
      }).catch(() => {})
    }
  }

  const isConnected = !!systemInfo

  return (
    <>
      <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-6 flex-shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Live Clock */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
            <Clock className="w-3.5 h-3.5 text-cyan-500" />
            <span className="font-mono">
              {dateTime.toLocaleDateString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}{' '}
              {dateTime.toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Device Specs Trigger */}
          <button
            onClick={handleDeviceClick}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-all duration-150 group shadow-sm cursor-pointer"
            title="Ver especificaciones completas del equipo"
          >
            <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-cyan-400">
              <Monitor className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[160px] truncate">
              {systemInfo?.hostname || systemInfo?.model || 'Detectando equipo...'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-slate-400'
              }`}
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform group-hover:translate-y-0.5" />
          </button>
        </div>
      </header>

      <SystemSpecsModal />
    </>
  )
}
