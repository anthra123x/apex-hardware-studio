import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Check, X, RotateCcw, ArrowLeft, RefreshCw, Video } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/shared/Button'
import { useDiagnosticStore } from '../stores/diagnostic.store'

export function CameraTest() {
  const navigate = useNavigate()
  const setManualTestResult = useDiagnosticStore((s) => s.setManualTestResult)
  const existingResult = useDiagnosticStore((s) => s.manualResults['camera'])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  const loadDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = allDevices.filter((d) => d.kind === 'videoinput')
      setDevices(videoDevices)
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId)
      }
    } catch {}
  }, [selectedDeviceId])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
  }, [stream])

  const startCamera = useCallback(async (devId?: string) => {
    stopCamera()
    setError(null)
    setCapturedImage(null)

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: devId ? { exact: devId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      }
      const s = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        await videoRef.current.play()
      }

      const track = s.getVideoTracks()[0]
      const settings = track.getSettings ? track.getSettings() : {}
      const w = settings.width || videoRef.current?.videoWidth || 1280
      const h = settings.height || videoRef.current?.videoHeight || 720
      setResolution(`${w} × ${h}`)

      loadDevices()
    } catch (err: any) {
      setError(err?.message || 'No se pudo inicializar la cámara. Verifique permisos o controlador.')
    }
  }, [stopCamera, loadDevices])

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      setCapturedImage(canvas.toDataURL('image/png'))
    }
  }, [])

  useEffect(() => {
    loadDevices()
    return () => {
      stopCamera()
    }
  }, [])

  const handleSaveResult = (status: 'PASS' | 'FAIL') => {
    stopCamera()
    setManualTestResult(
      'camera',
      status,
      { resolution, captured: !!capturedImage },
      status === 'PASS' ? `Cámara funcional (${resolution || 'OK'})` : 'Fallo en captura de video de cámara'
    )
    navigate('/diagnostic/manual')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { stopCamera(); navigate('/diagnostic/manual') }}
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
            <Camera className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prueba de Cámara & Video</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Inicie el sensor de video, verifique la fluidez, nitidez y capture una foto de prueba.
        </p>
      </div>

      {/* Video Viewport Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-4">
        {/* Device selector if multiple */}
        {devices.length > 1 && (
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value)
                startCamera(e.target.value)
              }}
              className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-slate-700 dark:text-slate-200"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Cámara ${d.deviceId.slice(0, 5)}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
          {!stream && !capturedImage && (
            <div className="text-center p-6">
              <Camera className="w-14 h-14 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Presione "Iniciar Cámara" para conectar</p>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain ${stream && !capturedImage ? '' : 'hidden'}`}
          />

          {capturedImage && (
            <img src={capturedImage} alt="Captura de prueba" className="w-full h-full object-contain" />
          )}

          {resolution && stream && (
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[11px] font-mono text-cyan-400">
              {resolution}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap gap-3 items-center justify-between pt-2">
          <div className="flex gap-2">
            {!stream ? (
              <Button icon={<Camera className="w-4 h-4" />} onClick={() => startCamera(selectedDeviceId)}>
                Iniciar Cámara
              </Button>
            ) : (
              <>
                <Button variant="secondary" icon={<Camera className="w-4 h-4" />} onClick={captureImage}>
                  Capturar Foto
                </Button>
                <Button variant="danger" onClick={stopCamera}>
                  Detener Video
                </Button>
              </>
            )}
            {capturedImage && (
              <Button variant="ghost" icon={<RotateCcw className="w-4 h-4" />} onClick={() => setCapturedImage(null)}>
                Descartar Foto
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
            ¿La imagen es clara, enfocada y sin artefactos visuales?
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
            Aprobar Cámara
          </Button>
        </div>
      </div>
    </div>
  )
}
