import { describe, it, expect, beforeEach } from 'vitest'
import { useDiagnosticStore } from '../../renderer/src/stores/diagnostic.store'

describe('diagnostic.store', () => {
  beforeEach(() => {
    useDiagnosticStore.getState().reset()
  })

  describe('startDiagnostic', () => {
    it('sets isRunning to true and resets phases to PENDING', () => {
      const store = useDiagnosticStore.getState()
      store.startDiagnostic()
      const state = useDiagnosticStore.getState()

      expect(state.isRunning).toBe(true)
      expect(state.currentPhase).toBe('system')
      expect(state.currentDiagnostic).toBeNull()
      state.phases.forEach((phase) => {
        expect(phase.status).toBe('PENDING')
      })
    })
  })

  describe('updatePhase', () => {
    it('updates a specific phase status and results', () => {
      const store = useDiagnosticStore.getState()
      store.startDiagnostic()
      store.updatePhase('cpu', 'PASS', [
        { id: 'c1', category: 'HARDWARE', testName: 'Velocidad', status: 'PASS', value: '2.4 GHz' },
      ])

      const state = useDiagnosticStore.getState()
      const cpuPhase = state.phases.find((p) => p.id === 'cpu')
      expect(cpuPhase?.status).toBe('PASS')
      expect(cpuPhase?.results).toHaveLength(1)
      expect(cpuPhase?.results[0].value).toBe('2.4 GHz')
    })

    it('marks a phase as FAIL', () => {
      const store = useDiagnosticStore.getState()
      store.startDiagnostic()
      store.updatePhase('gpu', 'FAIL', [
        { id: 'g1', category: 'HARDWARE', testName: 'GPU Test', status: 'FAIL', observations: 'No GPU detected' },
      ])

      const state = useDiagnosticStore.getState()
      const gpuPhase = state.phases.find((p) => p.id === 'gpu')
      expect(gpuPhase?.status).toBe('FAIL')
      expect(gpuPhase?.results[0].observations).toBe('No GPU detected')
    })

    it('keeps other phases unchanged', () => {
      const store = useDiagnosticStore.getState()
      store.startDiagnostic()
      store.updatePhase('cpu', 'PASS', [])
      store.updatePhase('ram', 'RUNNING')

      const state = useDiagnosticStore.getState()
      const cpuPhase = state.phases.find((p) => p.id === 'cpu')
      const ramPhase = state.phases.find((p) => p.id === 'ram')
      const gpuPhase = state.phases.find((p) => p.id === 'gpu')

      expect(cpuPhase?.status).toBe('PASS')
      expect(ramPhase?.status).toBe('RUNNING')
      expect(gpuPhase?.status).toBe('PENDING')
    })
  })

  describe('completeDiagnostic', () => {
    it('builds a diagnostic result with APROBADO when all pass', () => {
      const store = useDiagnosticStore.getState()
      store.setSystemInfo({ hostname: 'TEST-PC', model: 'X1', serial: 'SN-001', manufacturer: 'Lenovo' } as any)
      store.startDiagnostic()

      const phaseIds = ['system', 'cpu', 'ram', 'gpu', 'storage', 'battery', 'sensors', 'network']
      phaseIds.forEach((id) => store.updatePhase(id, 'PASS', [{ id: `${id}-1`, category: 'HARDWARE', testName: id, status: 'PASS' }]))

      store.completeDiagnostic('APROBADO', 'Todos los componentes funcionan correctamente.')
      const state = useDiagnosticStore.getState()

      expect(state.isRunning).toBe(false)
      expect(state.currentPhase).toBe('')
      expect(state.currentDiagnostic).not.toBeNull()
      expect(state.currentDiagnostic?.status).toBe('APROBADO')
      expect(state.currentDiagnostic?.summary).toBe('Todos los componentes funcionan correctamente.')
      expect(state.currentDiagnostic?.results).toHaveLength(8)
    })

    it('builds a diagnostic with NO_APROBADO when some fail', () => {
      const store = useDiagnosticStore.getState()
      store.setSystemInfo({ hostname: 'TEST-PC', model: 'X1', serial: 'SN-001', manufacturer: 'Lenovo' } as any)
      store.startDiagnostic()

      store.updatePhase('cpu', 'PASS', [])
      store.updatePhase('ram', 'FAIL', [{ id: 'r1', category: 'HARDWARE', testName: 'RAM Test', status: 'FAIL', observations: 'Memory error' }])

      store.completeDiagnostic('NO_APROBADO', '1 fase(s) con FALLO.')
      const state = useDiagnosticStore.getState()

      expect(state.currentDiagnostic?.status).toBe('NO_APROBADO')
    })

    it('includes manual tests in the diagnostic', () => {
      const store = useDiagnosticStore.getState()
      store.setSystemInfo({ hostname: 'TEST-PC', model: 'X1', serial: 'SN-001', manufacturer: 'Lenovo' } as any)
      store.startDiagnostic()

      store.completeDiagnostic('APROBADO', 'Ok')
      const state = useDiagnosticStore.getState()

      expect(state.currentDiagnostic?.manualTests).toEqual([])
    })
  })

  describe('setSystemInfo', () => {
    it('stores system info', () => {
      const info = { hostname: 'MY-PC', model: 'Latitude 5420', serial: 'ABC123', manufacturer: 'Dell', os: { platform: 'win32' } }
      useDiagnosticStore.getState().setSystemInfo(info as any)

      expect(useDiagnosticStore.getState().systemInfo?.hostname).toBe('MY-PC')
      expect(useDiagnosticStore.getState().systemInfo?.manufacturer).toBe('Dell')
    })
  })

  describe('setSystemSpecs', () => {
    it('stores system specs', () => {
      const specs = { cpu: { brand: 'Core i7' }, ram: { total: 17179869184 } }
      useDiagnosticStore.getState().setSystemSpecs(specs as any)

      expect(useDiagnosticStore.getState().systemSpecs?.cpu?.brand).toBe('Core i7')
      expect(useDiagnosticStore.getState().systemSpecs?.ram?.total).toBe(17179869184)
    })
  })

  describe('reset', () => {
    it('restores initial state', () => {
      const store = useDiagnosticStore.getState()
      store.startDiagnostic()
      store.updatePhase('cpu', 'PASS', [])
      store.completeDiagnostic('APROBADO', 'Ok')

      useDiagnosticStore.getState().reset()
      const state = useDiagnosticStore.getState()

      expect(state.isRunning).toBe(false)
      expect(state.currentDiagnostic).toBeNull()
      expect(state.currentPhase).toBe('')
      state.phases.forEach((phase) => {
        expect(phase.status).toBe('PENDING')
      })
    })
  })

  describe('manual test management', () => {
    it('sets and clears manual test results', () => {
      const store = useDiagnosticStore.getState()
      store.setManualTestResult('audio', 'PASS', { channels: 'stereo' }, 'Audio L y R OK')
      store.setManualTestResult('screen', 'WARN', { deadPixels: 1 })

      let state = useDiagnosticStore.getState()
      expect(state.manualResults['audio']).toBeDefined()
      expect(state.manualResults['audio'].result).toBe('PASS')
      expect(state.manualResults['screen'].result).toBe('WARN')

      store.clearManualTests()
      state = useDiagnosticStore.getState()
      expect(Object.keys(state.manualResults)).toHaveLength(0)
    })
  })

  describe('theme & technician', () => {
    it('updates theme and technician name', () => {
      const store = useDiagnosticStore.getState()
      store.setTheme('dark')
      expect(useDiagnosticStore.getState().theme).toBe('dark')

      store.setTheme('light')
      expect(useDiagnosticStore.getState().theme).toBe('light')

      store.setTechnicianName('Alex Rodriguez')
      expect(useDiagnosticStore.getState().technicianName).toBe('Alex Rodriguez')
    })
  })

  describe('lowSpecMode', () => {
    it('toggles lowSpecMode and updates localStorage', () => {
      const store = useDiagnosticStore.getState()
      store.setLowSpecMode(true)
      expect(useDiagnosticStore.getState().lowSpecMode).toBe(true)
      expect(localStorage.getItem('apex_low_spec_mode')).toBe('true')

      store.setLowSpecMode(false)
      expect(useDiagnosticStore.getState().lowSpecMode).toBe(false)
      expect(localStorage.getItem('apex_low_spec_mode')).toBe('false')
    })
  })
})
