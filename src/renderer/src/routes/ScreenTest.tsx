import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Monitor, ArrowLeft, Maximize2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/shared/Button'
import { useDiagnosticStore } from '../stores/diagnostic.store'

const colors = [
  { name: 'Blanco', hex: '#FFFFFF', textDark: true },
  { name: 'Negro', hex: '#000000', textDark: false },
  { name: 'Rojo', hex: '#EF4444', textDark: false },
  { name: 'Verde', hex: '#10B981', textDark: false },
  { name: 'Azul', hex: '#3B82F6', textDark: false },
  { name: 'Amarillo', hex: '#FACC15', textDark: true },
  { name: 'Magenta', hex: '#EC4899', textDark: false },
  { name: 'Cian', hex: '#06B6D4', textDark: true },
]

export function ScreenTest() {
  const navigate = useNavigate()
  const setManualTestResult = useDiagnosticStore((s) => s.setManualTestResult)
  const existingResult = useDiagnosticStore((s) => s.manualResults['screen'])

  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null)
  const [testedColors, setTestedColors] = useState<Set<string>>(new Set())

  const openFullscreen = (index: number) => {
    setFullscreenIndex(index)
    setTestedColors((prev) => new Set(prev).add(colors[index].name))
  }

  const closeFullscreen = () => {
    setFullscreenIndex(null)
  }

  const nextColor = useCallback(() => {
    setFullscreenIndex((prev) => {
      if (prev === null) return 0
      const nextIdx = (prev + 1) % colors.length
      setTestedColors((p) => new Set(p).add(colors[nextIdx].name))
      return nextIdx
    })
  }, [])

  const prevColor = useCallback(() => {
    setFullscreenIndex((prev) => {
      if (prev === null) return 0
      const nextIdx = (prev - 1 + colors.length) % colors.length
      setTestedColors((p) => new Set(p).add(colors[nextIdx].name))
      return nextIdx
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullscreenIndex === null) return
      if (e.key === 'Escape') {
        closeFullscreen()
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        nextColor()
      } else if (e.key === 'ArrowLeft') {
        prevColor()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreenIndex, nextColor, prevColor])

  const handleSaveResult = (status: 'PASS' | 'FAIL') => {
    setManualTestResult(
      'screen',
      status,
      { colorsTested: Array.from(testedColors) },
      status === 'PASS' ? 'Pantalla sin píxeles muertos ni aberraciones cromáticas' : 'Se detectaron anomalías o píxeles defectuosos en pantalla'
    )
    navigate('/diagnostic/manual')
  }

  const currentColor = fullscreenIndex !== null ? colors[fullscreenIndex] : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/diagnostic/manual')}
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
            <Monitor className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prueba de Pantalla & Píxeles</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Haga clic en cualquiera de los colores para entrar en modo pantalla completa. Inspeccione la pantalla minuciosamente en busca de píxeles apagados, atascados o fugas de luz.
        </p>
      </div>

      {/* Colors Grid */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Patrones de Color</h3>
          <Button
            size="sm"
            icon={<Maximize2 className="w-4 h-4" />}
            onClick={() => openFullscreen(0)}
          >
            Iniciar Secuencia Completa
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {colors.map((c, i) => {
            const isTested = testedColors.has(c.name)
            return (
              <motion.button
                key={c.name}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openFullscreen(i)}
                style={{ backgroundColor: c.hex }}
                className="aspect-video rounded-xl border-2 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-3 shadow-sm hover:shadow-md transition-all cursor-pointer relative group"
              >
                <span className={`text-xs font-black px-2 py-1 rounded bg-black/40 text-white backdrop-blur-sm`}>
                  {c.name}
                </span>
                {isTested && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-sm ring-2 ring-white" />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Decision Section */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dictamen de la Prueba</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ¿La pantalla muestra todos los colores sin defectos ni píxeles atascados?
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
            Aprobar Pantalla
          </Button>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {fullscreenIndex !== null && currentColor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backgroundColor: currentColor.hex }}
            className="fixed inset-0 z-50 flex flex-col justify-between p-8 select-none"
            onClick={nextColor}
          >
            {/* Top Bar info */}
            <div className="flex items-center justify-between">
              <span className={`text-sm font-black px-3 py-1.5 rounded-lg backdrop-blur-md ${
                currentColor.textDark ? 'bg-black/60 text-white' : 'bg-white/60 text-black'
              }`}>
                Patrón: {currentColor.name} ({fullscreenIndex + 1}/{colors.length})
              </span>

              <span className={`text-xs font-medium px-3 py-1.5 rounded-lg backdrop-blur-md ${
                currentColor.textDark ? 'bg-black/60 text-white' : 'bg-white/60 text-black'
              }`}>
                Click o Flechas para cambiar • ESC para salir
              </span>
            </div>

            {/* Bottom floating action controls */}
            <div className="flex items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={prevColor}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={closeFullscreen}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-white/90 text-slate-900 backdrop-blur-md hover:bg-white shadow-lg transition-colors"
              >
                Terminar Vista
              </button>
              <button
                onClick={nextColor}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
