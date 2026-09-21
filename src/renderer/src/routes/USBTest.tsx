import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Usb, Check, X, Plug, Unplug, ArrowLeft, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/shared/Button'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/constants/ipc-channels'
import { useDiagnosticStore } from '../stores/diagnostic.store'

interface USBDevice {
  name: string
  detectedAt: string
}

export function USBTest() {
  const navigate = useNavigate()
  const setManualTestResult = useDiagnosticStore((s) => s.setManualTestResult)
  const existingResult = useDiagnosticStore((s) => s.manualResults['usb'])

  const [devices, setDevices] = useState<USBDevice[]>([])
  const [detectionCount, setDetectionCount] = useState(0)
  const [monitoring, setMonitoring] = useState(false)
  const { invoke, on } = useIpc()

  useEffect(() => {
    if (!monitoring) return
    const cleanup = on(IPC_CHANNELS.MANUAL_USB_EVENT, (data: any) => {
      if (data?.added) {
        const now = new Date().toLocaleTimeString('es-MX')
        const newDevices = data.added.map((name: string) => ({
          name,
          detectedAt: now,
        }))
        setDevices((prev) => [...newDevices, ...prev])
        setDetectionCount((c) => c + data.added.length)
      }
    })
    return () => {
      cleanup()
    }
  }, [monitoring, on])

  const startMonitoring = useCallback(async () => {
    try {
      await invoke(IPC_CHANNELS.MANUAL_USB_MONITOR_START)
      setMonitoring(true)
    } catch {}
  }, [invoke])

  const stopMonitoring = useCallback(async () => {
    try {
      await invoke(IPC_CHANNELS.MANUAL_USB_MONITOR_STOP)
    } catch {}
    setMonitoring(false)
  }, [invoke])

  useEffect(() => {
    startMonitoring()
    return () => {
      stopMonitoring()
    }
  }, [startMonitoring, stopMonitoring])

  const handleSaveResult = (status: 'PASS' | 'FAIL') => {
    stopMonitoring()
    setManualTestResult(
      'usb',
      status,
      { detectionCount, devicesDetected: devices.map((d) => d.name) },
      status === 'PASS'
        ? `Puertos USB comprobados con ${detectionCount} inserciones`
        : 'Fallo al detectar dispositivos en puertos USB'
    )
    navigate('/diagnostic/manual')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { stopMonitoring(); navigate('/diagnostic/manual') }}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Pruebas
        </button>

        {existingResult && (
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            existingResult.result === 'PASS'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
          }`}>
            Estado actual: {existingResult.result}
          </span>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400">
            <Usb className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prueba de Puertos & Periféricos USB</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Conecte y desconecte una memoria USB o dispositivo en cada uno de los puertos para registrar las detecciones.
        </p>
      </div>

      {/* Monitoring Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm text-center">
        <motion.div
          animate={monitoring ? { scale: [1, 1.08, 1] } : {}}
          transition={monitoring ? { repeat: Infinity, duration: 1.5 } : {}}
          className={`inline-flex p-5 rounded-full mb-4 ${
            monitoring
              ? 'bg-cyan-500/10 text-cyan-500 ring-4 ring-cyan-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}
        >
          <Usb className="w-12 h-12" />
        </motion.div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          {monitoring ? 'Monitoreando Conexiones en Vivo...' : 'Monitoreo en Pausa'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Inserciones detectadas: <strong className="text-cyan-600 dark:text-cyan-400 font-mono text-sm">{detectionCount}</strong>
        </p>

        <div className="flex gap-2 justify-center">
          {!monitoring ? (
            <Button size="sm" icon={<Plug className="w-4 h-4" />} onClick={startMonitoring}>
              Reanudar Monitoreo
            </Button>
          ) : (
            <Button size="sm" variant="secondary" icon={<Unplug className="w-4 h-4" />} onClick={stopMonitoring}>
              Pausar Monitoreo
            </Button>
          )}
        </div>
      </div>

      {/* Detection Event Log */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Historial de Conexiones Detectadas
        </h3>

        {devices.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Conecte un dispositivo en cualquier puerto USB del equipo para verificar su funcionamiento.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <AnimatePresence>
              {devices.map((d, i) => (
                <motion.div
                  key={`${d.name}-${d.detectedAt}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Plug className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{d.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">{d.detectedAt}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Decision Section */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dictamen de la Prueba</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ¿Todos los puertos USB físicos del equipo responden correctamente?
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="danger"
            icon={<X className="w-4 h-4" />}
            onClick={() => handleSaveResult('FAIL')}
          >
            Marcar con Fallas
          </Button>
          <Button
            variant="primary"
            icon={<Check className="w-4 h-4" />}
            onClick={() => handleSaveResult('PASS')}
          >
            Aprobar Puertos USB
          </Button>
        </div>
      </div>
    </div>
  )
}
