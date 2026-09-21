import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Monitor,
  Keyboard,
  Mouse,
  Camera,
  Mic,
  Volume2,
  Wifi,
  Bluetooth,
  Usb,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { useDiagnosticStore } from '../stores/diagnostic.store'
import { Button } from '../components/shared/Button'

interface ManualTestMeta {
  id: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const manualTestsList: ManualTestMeta[] = [
  {
    id: 'screen',
    to: '/diagnostic/manual/screen',
    icon: Monitor,
    title: 'Pantalla & Píxeles',
    description: 'Verificación de píxeles muertos, colores RGB y uniformidad.',
  },
  {
    id: 'keyboard',
    to: '/diagnostic/manual/keyboard',
    icon: Keyboard,
    title: 'Teclado Físico',
    description: 'Comprobación de todas las teclas físicas con mapa virtual interactivo.',
  },
  {
    id: 'touchpad',
    to: '/diagnostic/manual/touchpad',
    icon: Mouse,
    title: 'Touchpad & Gestos',
    description: 'Prueba de arrastre, clic izquierdo/derecho y desplazamiento con dos dedos.',
  },
  {
    id: 'camera',
    to: '/diagnostic/manual/camera',
    icon: Camera,
    title: 'Cámara & Video',
    description: 'Comprobación del sensor de cámara, resolución y captura de prueba.',
  },
  {
    id: 'mic',
    to: '/diagnostic/manual/mic',
    icon: Mic,
    title: 'Micrófono & Captura',
    description: 'Grabación de voz, visualizador de nivel VU-meter y reproducción.',
  },
  {
    id: 'audio',
    to: '/diagnostic/manual/audio',
    icon: Volume2,
    title: 'Audio Estéreo (L / R)',
    description: 'Prueba de separación de canal izquierdo, canal derecho y tono estéreo.',
  },
  {
    id: 'wifi',
    to: '/diagnostic/manual/wifi',
    icon: Wifi,
    title: 'Adaptador WiFi',
    description: 'Detección del adaptador inalámbrico y escaneo de redes disponibles.',
  },
  {
    id: 'bluetooth',
    to: '/diagnostic/manual/bluetooth',
    icon: Bluetooth,
    title: 'Bluetooth',
    description: 'Verificación del controlador Bluetooth y dispositivos vinculados.',
  },
  {
    id: 'usb',
    to: '/diagnostic/manual/usb',
    icon: Usb,
    title: 'Puertos USB',
    description: 'Detección dinámica en tiempo real al conectar memorias o periféricos.',
  },
]

export function ManualTests() {
  const navigate = useNavigate()
  const manualResults = useDiagnosticStore((s) => s.manualResults)
  const clearManualTests = useDiagnosticStore((s) => s.clearManualTests)

  const completedCount = Object.keys(manualResults).length
  const passedCount = Object.values(manualResults).filter((r) => r.result === 'PASS').length
  const progressPercent = Math.round((completedCount / manualTestsList.length) * 100)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Progress Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Centro de Pruebas Manuales
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verifique el estado físico de los periféricos y componentes interactivos del equipo.
          </p>
        </div>

        {completedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={clearManualTests}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            Reiniciar Pruebas
          </Button>
        )}
      </div>

      {/* Progress Bar Banner */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Progreso de Verificación
          </span>
          <span className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400">
            {completedCount} de {manualTestsList.length} Realizadas ({passedCount} Aprobadas)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-300"
          />
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {manualTestsList.map((test, i) => {
          const Icon = test.icon
          const res = manualResults[test.id]
          const status = res?.result

          return (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -3 }}
              onClick={() => navigate(test.to)}
              className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-cyan-500/50 p-5 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between relative overflow-hidden"
            >
              {/* Status indicator line on top */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  status === 'PASS'
                    ? 'bg-emerald-500'
                    : status === 'FAIL'
                    ? 'bg-rose-500'
                    : status === 'WARN'
                    ? 'bg-amber-500'
                    : 'bg-transparent'
                }`}
              />

              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>

                  {status === 'PASS' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> APROBADO
                    </span>
                  )}
                  {status === 'FAIL' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      <XCircle className="w-3 h-3" /> FALLÓ
                    </span>
                  )}
                  {status === 'WARN' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <AlertCircle className="w-3 h-3" /> ATENCIÓN
                    </span>
                  )}
                  {!status && (
                    <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                      PENDIENTE
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                  {test.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {test.description}
                </p>
              </div>

              {res?.observations && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 truncate">
                  Nota: {res.observations}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
