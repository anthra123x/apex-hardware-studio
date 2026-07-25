import { useState, useEffect, useCallback } from 'react'
import { useIpc } from './useIpc'
import { useDiagnosticStore } from '../stores/diagnostic.store'
import { IPC_CHANNELS } from '../../../shared/constants/ipc-channels'
import type { SystemInfo } from '../../../shared/types/hardware.types'

export function useSystemInfo() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { invoke } = useIpc()
  const systemInfo = useDiagnosticStore((s) => s.systemInfo)
  const setSystemInfo = useDiagnosticStore((s) => s.setSystemInfo)
  const setSystemSpecs = useDiagnosticStore((s) => s.setSystemSpecs)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const info = await invoke(IPC_CHANNELS.GET_SYSTEM_INFO) as SystemInfo | null
      if (info) setSystemInfo(info)
      setTimeout(() => {
        invoke(IPC_CHANNELS.GET_SYSTEM_SPECS).then(s => s && setSystemSpecs(s as any)).catch(() => {})
      }, 100)
    } catch (err: any) {
      setError(err?.message || 'Error obteniendo información del sistema')
    } finally {
      setLoading(false)
    }
  }, [invoke, setSystemInfo, setSystemSpecs])

  const loadSpecs = useCallback(async () => {
    try {
      const specs = await invoke(IPC_CHANNELS.GET_SYSTEM_SPECS) as any
      if (specs) setSystemSpecs(specs)
    } catch {
      // best-effort
    }
  }, [invoke, setSystemSpecs])

  useEffect(() => {
    if (!systemInfo) {
      refresh()
    }
  }, [])

  return { systemInfo, loading, error, refresh, loadSpecs }
}
