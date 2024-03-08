import { ProxyApp } from './lib/index'

const proxy = ProxyApp.create(document.getElementById('webgl') as HTMLCanvasElement, {
  width: window.innerWidth,
  height: window.innerHeight,
  devicePixelRatio: window.devicePixelRatio,
  documentURI: ''
})

proxy.start('', () => {
  // proxy.getDocument()
  // debugger
})
