import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Check, X, Play, Square, ArrowLeft, Headphones, Radio } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/shared/Button'
import { useDiagnosticStore } from '../stores/diagnostic.store'

type ChannelMode = 'both' | 'left' | 'right'

export function AudioTest() {
  const navigate = useNavigate()
  const setManualTestResult = useDiagnosticStore((s) => s.setManualTestResult)
  const existingResult = useDiagnosticStore((s) => s.manualResults['audio'])

  const [playing, setPlaying] = useState(false)
  const [currentChannel, setCurrentChannel] = useState<ChannelMode>('both')
  const [leftTested, setLeftTested] = useState(false)
  const [rightTested, setRightTested] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const pannerRef = useRef<StereoPannerNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const stopTone = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop()
        oscillatorRef.current.disconnect()
      } catch {}
      oscillatorRef.current = null
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    setPlaying(false)
  }, [])

  const playTone = useCallback((channel: ChannelMode = 'both', freq = 440) => {
    stopTone()

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    audioCtxRef.current = ctx

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null

    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.value = 0.25

    if (panner) {
      if (channel === 'left') panner.pan.value = -1
      else if (channel === 'right') panner.pan.value = 1
      else panner.pan.value = 0

      osc.connect(gain)
      gain.connect(panner)
      panner.connect(ctx.destination)
    } else {
      osc.connect(gain)
      gain.connect(ctx.destination)
    }

    osc.start()
    osc.stop(ctx.currentTime + 2.5)

    osc.onended = () => {
      setPlaying(false)
      if (channel === 'left') setLeftTested(true)
      if (channel === 'right') setRightTested(true)
    }

    oscillatorRef.current = osc
    gainRef.current = gain
    pannerRef.current = panner
    setCurrentChannel(channel)
    setPlaying(true)
  }, [stopTone])

  useEffect(() => {
    return () => {
      stopTone()
    }
  }, [stopTone])

  const handleSaveResult = (status: 'PASS' | 'FAIL') => {
    stopTone()
    setManualTestResult(
      'audio',
      status,
      {
        channelL: leftTested,
        channelR: rightTested,
      },
      status === 'PASS' ? 'Canales Izquierdo y Derecho verificados' : 'Fallo en reproducción de audio'
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
            <Volume2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prueba de Audio Estéreo (L / R)</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Compruebe la salida de sonido en ambos altavoces o auriculares para certificar la separación estéreo.
        </p>
      </div>

      {/* Main Sound Console */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm text-center">
        <div className="flex flex-col items-center gap-6">
          <motion.div
            animate={playing ? { scale: [1, 1.06, 1] } : {}}
            transition={playing ? { repeat: Infinity, duration: 0.4 } : {}}
            className={`p-6 rounded-full transition-colors ${
              playing
                ? 'bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 ring-4 ring-cyan-400/20'
                : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <Headphones className={`w-14 h-14 ${playing ? 'text-cyan-500' : 'text-slate-400'}`} />
          </motion.div>

          {/* Stereo Channel Indicators */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <div className={`p-4 rounded-xl border transition-all ${
              playing && (currentChannel === 'left' || currentChannel === 'both')
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-500'
            }`}>
              <div className="text-xs uppercase tracking-wider mb-1">Canal Izquierdo (L)</div>
              <div className="text-lg font-black">{playing && (currentChannel === 'left' || currentChannel === 'both') ? 'EMITIENDO' : leftTested ? 'Probado' : 'Pendiente'}</div>
            </div>

            <div className={`p-4 rounded-xl border transition-all ${
              playing && (currentChannel === 'right' || currentChannel === 'both')
                ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-500'
            }`}>
              <div className="text-xs uppercase tracking-wider mb-1">Canal Derecho (R)</div>
              <div className="text-lg font-black">{playing && (currentChannel === 'right' || currentChannel === 'both') ? 'EMITIENDO' : rightTested ? 'Probado' : 'Pendiente'}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="secondary"
              icon={<Play className="w-4 h-4" />}
              onClick={() => playTone('left', 440)}
              disabled={playing}
            >
              Probar Canal Izquierdo (L)
            </Button>
            <Button
              variant="secondary"
              icon={<Play className="w-4 h-4" />}
              onClick={() => playTone('right', 440)}
              disabled={playing}
            >
              Probar Canal Derecho (R)
            </Button>
            <Button
              icon={<Radio className="w-4 h-4" />}
              onClick={() => playTone('both', 520)}
              disabled={playing}
            >
              Probar Ambos (Estéreo)
            </Button>
            {playing && (
              <Button
                variant="danger"
                icon={<Square className="w-4 h-4" />}
                onClick={stopTone}
              >
                Detener Tono
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Decision Section */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dictamen de la Prueba</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ¿Se escuchó el sonido con claridad y en los canales correctos?
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="danger"
            icon={<X className="w-4 h-4" />}
            onClick={() => handleSaveResult('FAIL')}
          >
            Marcar como Falló
          </Button>
          <Button
            variant="primary"
            icon={<Check className="w-4 h-4" />}
            onClick={() => handleSaveResult('PASS')}
          >
            Aprobar Audio
          </Button>
        </div>
      </div>
    </div>
  )
}
