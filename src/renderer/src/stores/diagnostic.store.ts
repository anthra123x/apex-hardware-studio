import { create } from 'zustand'
import type { Diagnostic, DiagnosticResult, AutoDiagnosticPhase } from '../../../shared/types/diagnostic.types'
import type { TestStatus, DiagnosticStatus } from '../../../shared/types/diagnostic.types'
import type { SystemInfo, CPUInfo, RAMInfo, GPUInfo, StorageInfo, BatteryInfo, SensorInfo, WifiInfo } from '../../../shared/types/hardware.types'

export interface FullSystemSpecs {
  cpu: CPUInfo | null
  ram: RAMInfo | null
  gpu: GPUInfo | null
  storage: StorageInfo[]
  battery: BatteryInfo | null
  sensors: SensorInfo | null
  wifi: WifiInfo | null
}

interface DiagnosticState {
  currentDiagnostic: Diagnostic | null
  isRunning: boolean
  currentPhase: string
  phases: AutoDiagnosticPhase[]
  manualResults: Record<string, ManualTestResult>
  systemInfo: SystemInfo | null
  systemSpecs: FullSystemSpecs | null
  specsModalOpen: boolean
  theme: 'dark' | 'light'
  lowSpecMode: boolean
  technicianName: string
  setSystemInfo: (info: SystemInfo) => void
  setSystemSpecs: (specs: FullSystemSpecs) => void
  setSpecsModalOpen: (open: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void
  setLowSpecMode: (enabled: boolean) => void
  setTechnicianName: (name: string) => void
  setManualTestResult: (testId: string, result: TestStatus, details?: Record<string, unknown>, observations?: string) => void
  clearManualTests: () => void
  startDiagnostic: () => void
  updatePhase: (phaseId: string, status: TestStatus, results?: DiagnosticResult[], label?: string, description?: string) => void
  completeDiagnostic: (status: DiagnosticStatus, summary: string) => void
  reset: () => void
}

const initialPhases: AutoDiagnosticPhase[] = [
  { id: 'system', label: 'Información del Sistema', description: 'Recopilando datos del equipo', status: 'PENDING', results: [] },
  { id: 'cpu', label: 'Diagnóstico de CPU', description: 'Verificando el procesador', status: 'PENDING', results: [] },
  { id: 'ram', label: 'Diagnóstico de RAM', description: 'Analizando la memoria', status: 'PENDING', results: [] },
  { id: 'gpu', label: 'Diagnóstico de GPU', description: 'Verificando la tarjeta gráfica', status: 'PENDING', results: [] },
  { id: 'storage', label: 'Almacenamiento', description: 'Verificando discos y SMART', status: 'PENDING', results: [] },
  { id: 'battery', label: 'Batería', description: 'Analizando estado de la batería', status: 'PENDING', results: [] },
  { id: 'sensors', label: 'Temperaturas', description: 'Monitoreando sensores térmicos', status: 'PENDING', results: [] },
  { id: 'network', label: 'Red', description: 'Probando conectividad de red', status: 'PENDING', results: [] },
]

const initialTheme: 'dark' | 'light' = (typeof window !== 'undefined' && localStorage.getItem('apex_theme') === 'light') ? 'light' : 'dark'
const initialLowSpec: boolean = (typeof window !== 'undefined' && localStorage.getItem('apex_low_spec_mode') !== null)
  ? localStorage.getItem('apex_low_spec_mode') === 'true'
  : (typeof navigator !== 'undefined' && (
      (navigator.hardwareConcurrency != null && navigator.hardwareConcurrency <= 4) ||
      ((navigator as any).deviceMemory != null && (navigator as any).deviceMemory <= 4)
    ))

if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', initialTheme === 'dark')
  document.documentElement.classList.toggle('low-spec', initialLowSpec)
}

export const useDiagnosticStore = create<DiagnosticState>((set) => ({
  currentDiagnostic: null,
  isRunning: false,
  currentPhase: '',
  phases: initialPhases,
  manualResults: {},
  systemInfo: null,
  systemSpecs: null,
  specsModalOpen: false,
  theme: initialTheme,
  lowSpecMode: initialLowSpec,
  technicianName: typeof window !== 'undefined' ? (localStorage.getItem('apex_technician') || '') : '',

  setSystemInfo: (info) => set({ systemInfo: info }),
  setSystemSpecs: (specs) => set({ systemSpecs: specs }),
  setSpecsModalOpen: (open) => set({ specsModalOpen: open }),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex_theme', theme)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
    set({ theme })
  },

  setLowSpecMode: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex_low_spec_mode', String(enabled))
    }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('low-spec', enabled)
    }
    set({ lowSpecMode: enabled })
  },

  setTechnicianName: (name) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('apex_technician', name)
    }
    set({ technicianName: name })
  },

  setManualTestResult: (testId, result, details, observations) => set((state) => ({
    manualResults: {
      ...state.manualResults,
      [testId]: {
        id: testId,
        testType: testId.toUpperCase() as any,
        result,
        details,
        observations,
      },
    },
  })),

  clearManualTests: () => set({ manualResults: {} }),

  startDiagnostic: () => set({
    isRunning: true,
    currentPhase: 'system',
    phases: initialPhases.map(p => ({ ...p, status: 'PENDING' as TestStatus })),
    currentDiagnostic: null,
  }),

  updatePhase: (phaseId, status, results, label?, description?) => set((state) => ({
    phases: state.phases.map(p =>
      p.id === phaseId ? { ...p, status, results: results || p.results, ...(label && { label }), ...(description && { description }) } : p
    ),
    currentPhase: phaseId,
  })),

  completeDiagnostic: (status, summary) => set((state) => {
    const allResults = state.phases.flatMap(p => p.results)
    const manualTests = Object.values(state.manualResults)
    return {
      isRunning: false,
      currentPhase: '',
      currentDiagnostic: {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `diag-${Date.now()}`,
        deviceId: state.systemInfo?.serial || '',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status,
        summary,
        results: allResults,
        manualTests,
      },
    }
  }),

  reset: () => set({
    currentDiagnostic: null,
    isRunning: false,
    currentPhase: '',
    phases: initialPhases,
  }),
}))
