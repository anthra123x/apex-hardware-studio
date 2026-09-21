import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Save, User, Monitor, Folder, Info, Check, Zap } from 'lucide-react'
import { Button } from '../components/shared/Button'
import { useIpc } from '../hooks/useIpc'
import { useDiagnosticStore } from '../stores/diagnostic.store'
import { IPC_CHANNELS } from '../../../shared/constants/ipc-channels'

export function Settings() {
  const storeTheme = useDiagnosticStore((s) => s.theme)
  const setStoreTheme = useDiagnosticStore((s) => s.setTheme)
  const storeTechnician = useDiagnosticStore((s) => s.technicianName)
  const setStoreTechnician = useDiagnosticStore((s) => s.setTechnicianName)
  const lowSpecMode = useDiagnosticStore((s) => s.lowSpecMode)
  const setLowSpecMode = useDiagnosticStore((s) => s.setLowSpecMode)

  const [technician, setTechnician] = useState(storeTechnician || '')
  const [theme, setTheme] = useState<'light' | 'dark'>(storeTheme || 'dark')
  const [outputDir, setOutputDir] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const { invoke } = useIpc()

  useEffect(() => {
    invoke(IPC_CHANNELS.SETTINGS_GET).then((s: any) => {
      if (s) {
        if (s.technician) {
          setTechnician(s.technician)
          setStoreTechnician(s.technician)
        }
        if (s.theme) {
          setTheme(s.theme)
          setStoreTheme(s.theme)
        }
        if (s.outputDir) setOutputDir(s.outputDir)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [invoke, setStoreTechnician, setStoreTheme])

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    setStoreTheme(newTheme)
  }

  const handleSave = async () => {
    setStoreTechnician(technician)
    setStoreTheme(theme)
    await invoke(IPC_CHANNELS.SETTINGS_SET, { technician, theme, outputDir })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleFolderPick = async () => {
    try {
      const dir = await invoke(IPC_CHANNELS.SETTINGS_SELECT_DIR)
      if (dir) setOutputDir(dir)
    } catch {
    }
  }

  if (loading) return null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <SettingsIcon className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-bold text-primary-900 dark:text-slate-100">Configuración</h2>
        </div>
        <p className="text-sm text-neutral-500 dark:text-slate-400">Personalización y ajustes de Apex Hardware Studio</p>
      </div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-primary-900 dark:text-slate-200">Técnico Responsable</h3>
          </div>
          <label className="block text-sm text-neutral-600 dark:text-slate-400 mb-1.5">Nombre del técnico o responsable del diagnóstico</label>
          <input
            type="text"
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
            placeholder="Ej. Técnico Especialista / Laboratorio"
            className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-neutral-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-primary-900 dark:text-slate-200">Apariencia Visual</h3>
          </div>
          <p className="text-sm text-neutral-600 dark:text-slate-400 mb-3">Selecciona el tema de la interfaz</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                theme === 'dark'
                  ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold shadow-sm'
                  : 'border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800'
              }`}
            >
              {theme === 'dark' && <Check className="w-4 h-4 text-primary-500" />}
              Oscuro (Recomendado)
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                theme === 'light'
                  ? 'border-primary-500 bg-primary-50 text-primary-600 font-semibold shadow-sm'
                  : 'border-neutral-200 dark:border-slate-700 text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800'
              }`}
            >
              {theme === 'light' && <Check className="w-4 h-4 text-primary-500" />}
              Claro
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <Folder className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-primary-900 dark:text-slate-200">Exportación de Reportes</h3>
          </div>
          <label className="block text-sm text-neutral-600 dark:text-slate-400 mb-1.5">Directorio predeterminado de guardado</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={outputDir}
              readOnly
              placeholder="Directorio predeterminado del sistema"
              className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 dark:border-slate-700 text-sm bg-neutral-50 dark:bg-slate-800 text-neutral-700 dark:text-slate-300"
            />
            <Button variant="secondary" onClick={handleFolderPick}>
              Examinar
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${lowSpecMode ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-primary-500/10 text-primary-500'}`}>
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-900 dark:text-slate-200 flex items-center gap-2">
                  Modo Equipos de Bajos Recursos
                  {lowSpecMode && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      ACTIVO
                    </span>
                  )}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
                  Optimizado para laptops con CPUs de 2-4 núcleos (Celeron, Pentium, Core i3), 4 GB RAM o discos mecánicos HDD.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLowSpecMode(!lowSpecMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                lowSpecMode ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={lowSpecMode}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  lowSpecMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Ejecución de pruebas secuencial (1 por 1)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Telemetría reducida a 8s para proteger discos HDD</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Desactivación de blur CSS y sombras GPU pesadas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Límite de memoria en benchmark seguro (máx 512 MB)</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-primary-900 dark:text-slate-200">Acerca de la Suite</h3>
          </div>
          <p className="text-base text-neutral-800 dark:text-slate-100">
            <strong className="text-primary-600 dark:text-primary-400 font-bold">Apex Hardware Studio</strong> v2.0.0
          </p>
          <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1 leading-relaxed">
            Suite profesional de diagnóstico integral de hardware, benchmarks de rendimiento, auditoría de drivers y herramientas de mantenimiento para estaciones de trabajo y portátiles con Windows.
          </p>
        </motion.div>

        <div className="flex justify-end">
          <Button
            size="lg"
            icon={<Save className="w-5 h-5" />}
            onClick={handleSave}
            className={saved ? 'bg-success text-white' : ''}
          >
            {saved ? 'Configuración Guardada' : 'Guardar Configuración'}
          </Button>
        </div>
      </div>
    </div>
  )
}
