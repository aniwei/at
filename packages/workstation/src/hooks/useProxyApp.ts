import { useMemo } from 'react'
import { ProxyApp } from '@at/core'

interface UseProxyAppOptions {
  width: number,
  height: number,
  devicePixelRatio: number,
}

export const useProxyApp = (
  documentURL: string,
  options: UseProxyAppOptions
) => {
  const element = document.createElement('canvas')
  const proxy = useMemo(() => {
    const proxy = ProxyApp.create(element, {
      ...options,
      documentURI: new URL('document', import.meta.url).href
    })

    proxy.start(new URL('app', import.meta.url).href).then(() => {
      proxy.api.document.commands.load(documentURL)
    })

    return proxy
  }, [
    element, 
    options.width, 
    options.height
  ])

  return proxy
}