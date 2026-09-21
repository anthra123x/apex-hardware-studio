import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wifi, Check, X, RefreshCw, Search, ArrowLeft, Signal, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/shared/Button'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/constants/ipc-channels'
import { useDiagnosticStore } from '../stores/diagnostic.store'

export function WiFiTest() {
  const navigate = useNavigate()
  const setManualTestResult = useDiagnosticStore((s) => s.setManualTestResult)
  const existingResult = useDiagnosticStore((s) => s.manualResults['wifi'])

  const [adapterPresent, setAdapterPresent] = useState(false)
  const [adapterName, setAdapterName] = useState('')
  const [connected, setConnected] = useState(false)
  const [ssid, setSsid] = useState('')
  const [scanning, setScanning] = useState(false)
  const [networks, setNetworks] = useState<string[]>([])
  const { invoke } = useIpc()

  const scanNetworks = useCallback(async () => {
    setScanning(true)
    try {
      const data = await invoke(IPC_CHANNELS.NETWORK_GET_WIFI)
      if (data) {
        if (data.adapterPresent != null) setAdapterPresent(data.adapterPresent)
        if (data.adapterName) setAdapterName(data.adapterName)
        if (data.connected != null) setConnected(data.connected)
        if (data.ssid) setSsid(data.ssid)
        if (data.availableNetworks) setNetworks(data.availableNetworks)
      }
    } catch {
    } finally {
      setScanning(false)
    }
  }, [invoke])

  useEffect(() => {
    scanNetworks()
  }, [scanNetworks])

  const handleSaveResult = (status: 'PASS' | 'FAIL') => {
    setManualTestResult(
      'wifi',
      status,
      { adapterPresent, adapterName, connected, ssid, networksCount: networks.length },
      status === 'PASS'
        ? `WiFi funcional (${adapterName || 'Adaptador OK'}) • ${networks.length} redes detectadas`
        : 'Fallo en adaptador o escaneo de redes WiFi'
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
            <Wifi className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Prueba de Conectividad WiFi</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Compruebe la presencia del adaptador inalámbrico y el escaneo de redes circundantes.
        </p>
      </div>

      {/* Adapter Status Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Estado del Adaptador
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Dispositivo</span>
            <span className="font-semibold text-slate-800 dark:text-white">{adapterName || 'Detectando...'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Adaptador Presente</span>
            <span className={`font-bold ${adapterPresent ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              {adapterPresent ? 'SÍ (Activo)' : 'NO DETECTADO'}
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-slate-500 dark:text-slate-400">Estado de Conexión</span>
            <span className={`font-bold ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
              {connected ? `Conectado a "${ssid}"` : 'Sin conexión activa'}
            </span>
          </div>
        </div>
      </div>

      {/* Available Networks Card */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Redes Inalámbricas Detectadas
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{networks.length} redes en rango</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={scanning}
            icon={<Search className="w-3.5 h-3.5" />}
            onClick={scanNetworks}
          >
            Escanear
          </Button>
        </div>

        {networks.length === 0 && !scanning && (
          <div className="text-center py-6 text-xs text-slate-400">
            No se detectaron redes o el escaneo está en progreso. Presione "Escanear" para actualizar.
          </div>
        )}

        {networks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {networks.map((net, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Signal className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{net}</span>
                </div>
                {net === ssid && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-500 border border-cyan-500/30">
                    CONECTADO
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Decision Section */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Dictamen de la Prueba</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ¿El adaptador WiFi opera correctamente y detecta señales inalámbricas?
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
            Aprobar WiFi
          </Button>
        </div>
      </div>
    </div>
  )
}
