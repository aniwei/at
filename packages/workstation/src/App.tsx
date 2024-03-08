import { useEffect, useRef } from 'react'
import { useProxyApp } from './hooks/useProxyApp'
import './App.css'

function App() {
  const ref = useRef<HTMLDivElement>(null)
  const proxy = useProxyApp('/document.at', {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
  })

  useEffect(() => {   
    proxy.api.document.events.on('end', (root) => {
      debugger
    })

    ref.current?.appendChild(proxy.element as HTMLCanvasElement)

    return () => {
      ref.current?.removeChild(proxy.element as HTMLCanvasElement)
      proxy.api.document.events.removeAllListeners()
    }
  }, [proxy])  

  return (
    <div ref={ref}>

    </div>
  )
}

export default App
