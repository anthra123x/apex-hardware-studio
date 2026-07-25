import { useRef, useMemo } from 'react'

interface ElectronApi {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  on: (channel: string, callback: (...args: unknown[]) => void) => void
  send: (channel: string, ...args: unknown[]) => void
}

export function useIpc() {
  const apiRef = useRef<ElectronApi>((window as any).api)

  return useMemo(() => ({
    invoke: apiRef.current.invoke.bind(apiRef.current),
    on: apiRef.current.on.bind(apiRef.current),
    send: apiRef.current.send.bind(apiRef.current),
  }), [])
}