import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mouse, Check, X, MousePointerClick, Scroll, ArrowLeft, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/shared/Button'
import { useDiagnosticStore } from '../stores/diagnostic.store'

interface TrailPoint {
  x: number
  y: number
  time: number
}

export function TouchpadTest() {
  const navigate = useNavigate()
  const setManualTestResult = useDiagnosticStore((s) => s.setManualTestResult)
  const existingResult = useDiagnosticStore((s) => s.manualResults['touchpad'])

  const areaRef = useRef<HTMLDivElement>(null)
  const [trail, setTrail] = useState<TrailPoint[]>([])
  const [leftClick, setLeftClick] = useState(false)
  const [rightClick, setRightClick] = useState(false)
  const [middleClick, setMiddleClick] = useState(false)
  const [scrollDetected, setScrollDetected] = useState(false)

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!areaRef.current) return
    const rect = areaRef.current.getBoundingClientRect()
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top, time: Date.now() }
    setTrail((prev) => {
      const next = [...prev, point]
      if (next.length > 120) next.splice(0, next.length - 120)
      return next
    })
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 0) setLeftClick(true)
    if (e.button === 1) setMiddleClick(true)
    if (e.button === 2) setRightClick(true)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  useEffect(() => {
    const handleWheel = () => {
      setScrollDetected(true)
    }
    const area = areaRef.current
    if (area) {
      area.addEventListener('wheel', handleWheel)
    }
    return () => {
      if (area) area.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const clearTrail = useCallback(() => {
    setTrail([])
    setLeftClick(false)
    setRightClick(false)
    setMiddleClick(false)
    setScrollDetected(false)
  }, [])

  const handleSaveResult = (status: 'PASS' | 'FAIL') => {
    setManualTestResult(
      'touchpad',
      status,
      { leftClick, rightClick, middleClick, scrollDetected },
      status === 'PASS' ? 'Touchpad con gestos, arrastre y clics verificados' : 'Anomalías en el touchpad o botones'
    )
    navigate('/diagnostic/manual')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
            <Mouse className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prueba de Touchpad & Gestos</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Mueva el cursor sobre el lienzo, haga clic izquierdo, clic derecho y desplace la rueda/dos dedos para comprobar la respuesta.
        </p>
      </div>

      {/* Feature checklist chips */}
      <div className="flex flex-wrap gap-2">
        <span className={`text-xs font-semibold px-3 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
          trail.length > 5
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/30'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
        }`}>
          <Check className={`w-3.5 h-3.5 ${trail.length > 5 ? 'text-emerald-500' : 'text-slate-400'}`} />
          Rastreo de Movimiento
        </span>

        <span className={`text-xs font-semibold px-3 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
          leftClick
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/30'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
        }`}>
          <Check className={`w-3.5 h-3.5 ${leftClick ? 'text-emerald-500' : 'text-slate-400'}`} />
          Clic Izquierdo
        </span>

        <span className={`text-xs font-semibold px-3 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
          rightClick
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/30'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
        }`}>
          <Check className={`w-3.5 h-3.5 ${rightClick ? 'text-emerald-500' : 'text-slate-400'}`} />
          Clic Derecho
        </span>

        <span className={`text-xs font-semibold px-3 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
          scrollDetected
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/30'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
        }`}>
          <Check className={`w-3.5 h-3.5 ${scrollDetected ? 'text-emerald-500' : 'text-slate-400'}`} />
          Desplazamiento (Scroll)
        </span>
      </div>

      {/* Interactive Touchpad Area */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Área de Sensibilidad</span>
          <Button variant="ghost" size="sm" icon={<RotateCcw className="w-3 h-3" />} onClick={clearTrail}>
            Limpiar Trazo
          </Button>
        </div>

        <div
          ref={areaRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onContextMenu={handleContextMenu}
          className="relative bg-slate-50 dark:bg-slate-950/60 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 h-72 overflow-hidden cursor-crosshair flex items-center justify-center"
        >
          {trail.length === 0 && (
            <p className="text-xs text-slate-400 select-none pointer-events-none">
              Mueva el cursor y haga clic aquí para probar gestos
            </p>
          )}

          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {trail.length > 1 && (
              <polyline
                points={trail.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#06B6D4"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
            )}
            {trail.length > 0 && (
              <circle
                cx={trail[trail.length - 1].x}
                cy={trail[trail.length - 1].y}
                r={6}
                fill="#3B82F6"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Decision Section */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dictamen de la Prueba</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ¿El touchpad responde con fluidez y precisión a todos los movimientos y clics?
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
            Aprobar Touchpad
          </Button>
        </div>
      </div>
    </div>
  )
}
