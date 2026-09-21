import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Battery,
  Play,
  Monitor,
  Activity,
  ArrowRight,
  Shield,
  Gauge,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MousePointer2,
  Layers,
} from 'lucide-react'
import { useDiagnosticStore } from '../stores/diagnostic.store'
import { MetricCard } from '../components/diagnostic/MetricCard'
import { Button } from '../components/shared/Button'
import { useSystemInfo } from '../hooks/useSystemInfo'
import { useLiveMetrics } from '../hooks/useLiveMetrics'
import { useIpc } from '../hooks/useIpc'
import { IPC_CHANNELS } from '../../../shared/constants/ipc-channels'
import { useMemo, useState, useCallback } from 'react'
import type { ReportData, ReportSectionItem } from '../../../shared/types/report.types'

function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  const gb = bytes / 1073741824
  return `${gb.toFixed(1)} GB`
}

export function Dashboard() {
  const navigate = useNavigate()
  const systemInfo = useDiagnosticStore((s) => s.systemInfo)
  const systemSpecs = useDiagnosticStore((s) => s.systemSpecs)
  const currentDiagnostic = useDiagnosticStore((s) => s.currentDiagnostic)
  const manualResults = useDiagnosticStore((s) => s.manualResults)
  const technicianName = useDiagnosticStore((s) => s.technicianName)
  const lowSpecMode = useDiagnosticStore((s) => s.lowSpecMode)
  useSystemInfo()
  const { metrics: live } = useLiveMetrics(lowSpecMode ? 8000 : 5000)

  const mCpu = systemSpecs?.cpu
  const mRam = systemSpecs?.ram
  const mDisk = systemSpecs?.storage?.[0]

  const metrics = useMemo(() => [
    {
      icon: <Cpu className="w-5 h-5 text-blue-500" />,
      label: 'CPU',
      value: live.cpu.usage > 0
        ? `${live.cpu.usage}%`
        : (mCpu?.brand ? `${mCpu.brand}`.slice(0, 22) : '—'),
      subvalue: mCpu
        ? `${mCpu.cores} núcleos | ${live.cpu.speed || mCpu.speed} GHz${live.cpu.temperature != null ? ` | ${live.cpu.temperature}°C` : ''}`
        : null,
      status: live.cpu.usage >= 80 ? 'warning' as const : 'success' as const,
    },
    {
      icon: <MemoryStick className="w-5 h-5 text-purple-500" />,
      label: 'RAM',
      value: live.ram.total > 0
        ? `${live.ram.usagePercent}% (${formatBytes(live.ram.used)} / ${formatBytes(live.ram.total)})`
        : (mRam ? formatBytes(mRam.total) : '—'),
      subvalue: mRam && mRam.slots?.[0]?.size > 0
        ? `${mRam.slots[0].type || ''} ${mRam.slots[0].speed ? `@ ${mRam.slots[0].speed} MHz` : ''}`.trim() || null
        : null,
      status: live.ram.usagePercent >= 85 ? 'warning' as const : 'success' as const,
    },
    {
      icon: <HardDrive className="w-5 h-5 text-cyan-500" />,
      label: 'Almacenamiento',
      value: live.storage.totalGB > 0
        ? `${live.storage.usagePercent}% (${live.storage.freeGB} GB libres)`
        : '—',
      subvalue: mDisk
        ? `${mDisk.type || '?'} — ${mDisk.interfaceType || ''} ${mDisk.isBootDrive ? '(Sistema)' : ''}`
        : null,
      status: live.storage.usagePercent >= 90 ? 'danger' as const
        : live.storage.usagePercent >= 75 ? 'warning' as const
        : 'success' as const,
    },
    {
      icon: <Battery className="w-5 h-5 text-emerald-500" />,
      label: 'Batería',
      value: live.battery.hasBattery
        ? live.battery.isCharging
          ? `Cargando${live.battery.health != null ? ` (${live.battery.health}% salud)` : ''}`
          : `${live.battery.health ?? '—'}% salud`
        : (systemSpecs?.battery?.hasBattery ? 'Conectado a CA' : 'No detectada'),
      subvalue: live.battery.hasBattery
        ? `${live.battery.wearLevel != null ? `Desgaste ${live.battery.wearLevel}%` : ''}${live.battery.cycleCount != null ? ` • ${live.battery.cycleCount} ciclos` : ''}`
        : (systemSpecs?.battery?.hasBattery && !live.battery.hasBattery ? 'Batería interna conectada' : null),
      status: (live.battery.health ?? 100) < 60 ? 'danger' as const
        : (live.battery.health ?? 100) < 80 ? 'warning' as const
        : 'success' as const,
    },
  ], [live, systemSpecs, mCpu, mRam, mDisk])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  }

  const lastDiagStatus = currentDiagnostic?.status === 'APROBADO'
    ? 'success'
    : currentDiagnostic?.status === 'APROBADO_CON_OBSERVACIONES'
    ? 'warning'
    : 'danger'

  const statusColors = {
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  }

  const { invoke } = useIpc()
  const [exporting, setExporting] = useState(false)
  const [exportResult, setExportResult] = useState<'success' | 'error' | null>(null)

  const manualTestList = Object.values(manualResults)
  const manualPassed = manualTestList.filter((m) => m.result === 'PASS').length
  const manualFailed = manualTestList.filter((m) => m.result === 'FAIL').length

  const handleExport = useCallback(async () => {
    setExporting(true)
    setExportResult(null)
    try {
      const results: ReportSectionItem[] = []
      if (currentDiagnostic) {
        for (const r of currentDiagnostic.results) {
          results.push({
            name: r.testName,
            value: r.value || '—',
            status: r.status === 'PASS' ? 'PASS' : r.status === 'FAIL' ? 'FAIL' : r.status === 'WARN' ? 'WARN' : 'SKIP',
          })
        }
      }

      // Add manual tests into report
      const manualItems: ReportSectionItem[] = manualTestList.map((m) => ({
        name: `Prueba de ${m.testType}`,
        value: m.observations || (m.details ? JSON.stringify(m.details) : 'Completada'),
        status: m.result === 'PASS' ? 'PASS' : m.result === 'FAIL' ? 'FAIL' : m.result === 'WARN' ? 'WARN' : 'SKIP',
      }))

      const data: ReportData = {
        deviceName: systemInfo?.hostname || 'Apex-Workstation',
        model: systemInfo?.model || '—',
        serialNumber: systemInfo?.serial || '—',
        manufacturer: systemInfo?.manufacturer || '—',
        osInfo: `${systemInfo?.os?.distro || ''} ${systemInfo?.os?.release || ''}`.trim() || 'Windows 10/11',
        diagnosticDate: currentDiagnostic?.completedAt || new Date().toISOString(),
        technician: technicianName || 'Técnico Especialista',
        status: currentDiagnostic?.status || (manualFailed > 0 ? 'NO_APROBADO' : manualPassed > 0 ? 'APROBADO' : 'NO_APROBADO'),
        hardwareResults: results.filter(r => ['CPU', 'GPU', 'RAM', 'Board', 'BIOS', 'Procesador', 'Núcleos'].some(k => r.name.includes(k))),
        storageResults: results.filter(r => r.name.includes('Disco') || r.name.includes('SMART') || r.name.includes('Almacenamiento')),
        batteryResults: results.filter(r => r.name.includes('Bater') || r.name.includes('Salud') || r.name.includes('Capacidad')),
        manualTestResults: manualItems.length > 0 ? manualItems : (currentDiagnostic?.manualTests?.map(m => ({
          name: m.testType,
          value: m.details ? JSON.stringify(m.details) : '—',
          status: m.result === 'PASS' ? 'PASS' : m.result === 'FAIL' ? 'FAIL' : m.result === 'WARN' ? 'WARN' : 'SKIP',
        })) || []),
        observations: currentDiagnostic?.observations || '',
      }

      const result = await invoke(IPC_CHANNELS.REPORT_GENERATE, data)
      if (result?.success) {
        setExportResult('success')
      } else {
        setExportResult('error')
      }
    } catch {
      setExportResult('error')
    } finally {
      setExporting(false)
      setTimeout(() => setExportResult(null), 4000)
    }
  }, [invoke, systemInfo, currentDiagnostic, manualTestList, technicianName, manualFailed, manualPassed])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Device Hero Banner */}
        <motion.div
          variants={item}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white shadow-lg border border-slate-700/60"
        >
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/30 ring-1 ring-white/20">
                <Monitor className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    {systemInfo?.hostname || 'Apex Hardware Studio'}
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 rounded-full">
                    SISTEMA ACTIVO
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <span>{[systemInfo?.manufacturer, systemInfo?.model].filter(Boolean).join(' ') || 'Equipo de Cómputo'}</span>
                  {systemInfo?.serial && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="font-mono text-cyan-300">S/N: {systemInfo.serial}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                {new Date().toLocaleDateString('es-MX', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
              <p className="text-[11px] text-cyan-400 font-mono mt-0.5">
                {technicianName ? `Técnico: ${technicianName}` : 'Modo Técnico Activo'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Live Metrics Grid */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <MetricCard key={i} {...m} />
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={item} className="flex gap-3 flex-wrap items-center">
          <Button
            size="lg"
            icon={<Play className="w-5 h-5" />}
            onClick={() => navigate('/diagnostic/auto')}
          >
            Iniciar Diagnóstico Automático
          </Button>
          <Button
            size="lg"
            variant="secondary"
            icon={<MousePointer2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />}
            onClick={() => navigate('/diagnostic/manual')}
          >
            Pruebas Manuales
          </Button>
          <Button
            size="lg"
            variant="secondary"
            icon={<Gauge className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            onClick={() => navigate('/benchmark')}
          >
            Benchmark
          </Button>
          <Button
            size="lg"
            variant="outline"
            icon={exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Generando...' : 'Exportar Reporte'}
          </Button>

          {exportResult === 'success' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              Reporte guardado exitosamente
            </div>
          )}
          {exportResult === 'error' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              Error al guardar reporte
            </div>
          )}
        </motion.div>

        {/* Diagnostic & Manual Test Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Last Diagnostic Card */}
          <motion.div
            variants={item}
            className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400 rounded-xl">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Último Diagnóstico</h3>
                    <p className="text-xs text-slate-400">
                      {currentDiagnostic?.completedAt
                        ? new Date(currentDiagnostic.completedAt).toLocaleString('es-MX')
                        : 'Aún no ejecutado'}
                    </p>
                  </div>
                </div>
                {currentDiagnostic && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[lastDiagStatus]}`}>
                    {currentDiagnostic.status === 'APROBADO' ? 'Aprobado' : currentDiagnostic.status === 'APROBADO_CON_OBSERVACIONES' ? 'Con Obs.' : 'No Aprobado'}
                  </span>
                )}
              </div>

              {currentDiagnostic ? (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {currentDiagnostic.summary}
                  </p>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-mono">
                    <Shield className="w-4 h-4 text-cyan-500" />
                    <span>
                      {currentDiagnostic.results.filter(r => r.status === 'PASS').length} OK • {currentDiagnostic.results.filter(r => r.status === 'FAIL').length} fallos • {currentDiagnostic.results.filter(r => r.status === 'WARN').length} alertas
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  Ejecute un diagnóstico automático de 8 fases para verificar la salud completa de hardware y sistema.
                </p>
              )}
            </div>

            <div className="mt-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Play className="w-3.5 h-3.5" />}
                onClick={() => navigate('/diagnostic/auto')}
              >
                {currentDiagnostic ? 'Repetir Diagnóstico' : 'Comenzar Diagnóstico'}
              </Button>
            </div>
          </motion.div>

          {/* Manual Tests Summary Card */}
          <motion.div
            variants={item}
            className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <MousePointer2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pruebas Manuales</h3>
                    <p className="text-xs text-slate-400">
                      {manualTestList.length} de 9 pruebas realizadas
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {manualPassed}/9 APROBADAS
                </span>
              </div>

              {manualTestList.length > 0 ? (
                <div className="space-y-1.5 mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {manualTestList.map((t) => (
                      <span
                        key={t.id}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          t.result === 'PASS'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {t.id}: {t.result}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">
                  Verifique componentes físicos manualmente: Teclado, Pantalla, Audio Estéreo, Touchpad, Cámara, Micrófono, USB, WiFi y Bluetooth.
                </p>
              )}
            </div>

            <div className="mt-4 pt-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/diagnostic/manual')}
              >
                Ir a Centro de Pruebas
              </Button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
