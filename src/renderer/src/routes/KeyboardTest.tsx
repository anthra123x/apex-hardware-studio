import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Keyboard, Check, X, ArrowLeft, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { VirtualKeyboard } from '../components/keyboard/VirtualKeyboard'
import { Button } from '../components/shared/Button'
import { useDiagnosticStore } from '../stores/diagnostic.store'

export function KeyboardTest() {
  const navigate = useNavigate()
  const setManualTestResult = useDiagnosticStore((s) => s.setManualTestResult)
  const existingResult = useDiagnosticStore((s) => s.manualResults['keyboard'])

  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [totalPresses, setTotalPresses] = useState(0)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault()
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key
    const mappedKey = key === ' ' ? ' ' : key === 'Escape' ? 'Esc' : key === 'CapsLock' ? 'Caps' : key

    setPressedKeys((prev) => {
      const next = new Set(prev)
      next.add(mappedKey)
      return next
    })
    setTotalPresses((p) => p + 1)
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    e.preventDefault()
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  const virtualKeyPress = useCallback((key: string) => {
    setPressedKeys((prev) => {
      const next = new Set(prev)
      next.add(key)
      return next
    })
    setTotalPresses((p) => p + 1)
  }, [])

  const resetKeys = useCallback(() => {
    setPressedKeys(new Set())
    setTotalPresses(0)
  }, [])

  const totalKeys = 104
  const progress = Math.min(100, Math.round((pressedKeys.size / totalKeys) * 100))

  const handleSaveResult = (status: 'PASS' | 'FAIL') => {
    setManualTestResult(
      'keyboard',
      status,
      { pressedCount: pressedKeys.size, totalPresses },
      status === 'PASS' ? `${pressedKeys.size} teclas verificadas sin anomalías` : 'Se reportaron teclas que no responden o atascos'
    )
    navigate('/diagnostic/manual')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
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
            <Keyboard className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prueba de Teclado Físico</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Presione cada tecla del teclado físico. Las teclas detectadas se iluminarán en el mapa virtual inferior.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Teclas Únicas: <strong className="text-slate-900 dark:text-white text-sm">{pressedKeys.size}</strong>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              Pulsaciones: <strong className="text-slate-900 dark:text-white text-sm">{totalPresses}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={resetKeys}>
              Limpiar Teclado
            </Button>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">{progress}% probado</span>
          </div>
        </div>

        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full"
          />
        </div>

        <div className="pt-2 overflow-x-auto">
          <VirtualKeyboard onKeyPress={virtualKeyPress} testedKeys={pressedKeys} />
        </div>
      </div>

      {/* Decision Section */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dictamen de la Prueba</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ¿Todas las teclas del teclado físico responden con normalidad y sin repeticiones fantasmas?
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
            Aprobar Teclado
          </Button>
        </div>
      </div>
    </div>
  )
}
