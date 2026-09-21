import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, Play, Check, X, Square, ArrowLeft, RotateCcw, Volume2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/shared/Button'
import { useDiagnosticStore } from '../stores/diagnostic.store'

export function MicrophoneTest() {
  const navigate = useNavigate()
  const setManualTestResult = useDiagnosticStore((s) => s.setManualTestResult)
  const existingResult = useDiagnosticStore((s) => s.manualResults['mic'])

  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [playing, setPlaying] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanupAudio = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    setRecording(false)
    setAudioLevel(0)
  }, [])

  const startRecording = useCallback(async () => {
    cleanupAudio()
    setError(null)
    setAudioBlob(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setCountdown(4)

      const updateLevel = () => {
        if (analyserRef.current) {
          const data = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(data)
          const avg = data.reduce((a, b) => a + b, 0) / data.length
          setAudioLevel(Math.min(avg / 100, 1))
        }
        animFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      let remaining = 4
      intervalRef.current = setInterval(() => {
        remaining--
        setCountdown(remaining)
        if (remaining <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          cleanupAudio()
        }
      }, 1000)
    } catch (err: any) {
      setError(err?.message || 'No se pudo acceder al micrófono. Verifique los permisos en el sistema.')
      setRecording(false)
    }
  }, [cleanupAudio])

  const playRecording = useCallback(() => {
    if (!audioBlob) return
    const url = URL.createObjectURL(audioBlob)
    const audio = new Audio(url)
    audioPlaybackRef.current = audio
    audio.onended = () => {
      setPlaying(false)
      URL.revokeObjectURL(url)
    }
    audio.play()
    setPlaying(true)
  }, [audioBlob])

  useEffect(() => {
    return () => {
      cleanupAudio()
    }
  }, [cleanupAudio])

  const handleSaveResult = (status: 'PASS' | 'FAIL') => {
    cleanupAudio()
    setManualTestResult(
      'mic',
      status,
      { hasRecording: !!audioBlob },
      status === 'PASS' ? 'Micrófono con captura clara y nivel óptimo' : 'Fallo en la captura de micrófono'
    )
    navigate('/diagnostic/manual')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { cleanupAudio(); navigate('/diagnostic/manual') }}
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
            <Mic className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prueba de Micrófono & Captura</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Grabe una muestra de voz de 4 segundos, observe el medidor VU-meter en tiempo real y reproduzca para verificar fidelidad.
        </p>
      </div>

      {/* Main Mic Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 shadow-sm text-center">
        <div className="flex flex-col items-center gap-6">
          <motion.div
            animate={recording ? { scale: [1, 1.1, 1] } : {}}
            transition={recording ? { repeat: Infinity, duration: 0.5 } : {}}
            className={`p-6 rounded-full transition-colors ${
              recording
                ? 'bg-rose-500/20 text-rose-500 ring-4 ring-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Mic className="w-12 h-12" />
          </motion.div>

          {/* VU Meter Bars */}
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Nivel de Entrada</span>
              <span>{Math.round(audioLevel * 100)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <motion.div
                animate={{ width: `${audioLevel * 100}%` }}
                transition={{ duration: 0.05 }}
                className={`h-full rounded-full ${
                  audioLevel > 0.85
                    ? 'bg-rose-500'
                    : audioLevel > 0.6
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                }`}
              />
            </div>
          </div>

          {recording && (
            <p className="text-sm font-bold text-rose-500 animate-pulse">
              Grabando muestra... {countdown}s
            </p>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-3 justify-center">
            {!recording ? (
              <Button
                size="lg"
                icon={<Mic className="w-4 h-4" />}
                onClick={startRecording}
              >
                {audioBlob ? 'Grabar de Nuevo' : 'Iniciar Grabación (4s)'}
              </Button>
            ) : (
              <Button
                size="lg"
                variant="danger"
                icon={<Square className="w-4 h-4" />}
                onClick={cleanupAudio}
              >
                Detener
              </Button>
            )}

            {audioBlob && !recording && (
              <Button
                size="lg"
                variant="secondary"
                icon={<Play className="w-4 h-4 text-cyan-500" />}
                onClick={playRecording}
                disabled={playing}
              >
                {playing ? 'Reproduciendo...' : 'Escuchar Grabación'}
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
            ¿El micrófono grabó y reprodujo la voz con volumen y nitidez adecuados?
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
            Aprobar Micrófono
          </Button>
        </div>
      </div>
    </div>
  )
}
