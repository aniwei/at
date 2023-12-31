import { Paint, Canvas } from '@at/engine'
import { Size } from '@at/geometry'
import { ProxyApp } from './lib/index'

const proxy = ProxyApp.create(document.getElementById('webgl') as HTMLCanvasElement, {
  width: window.innerWidth,
  height: window.innerHeight,
  devicePixelRatio: window.devicePixelRatio
})

proxy.start(() => {
  // proxy.getDocument()
  // debugger
})

let t
proxy.api.Engine.events.on('pipeline.flush.start', () => {
  console.log('start', t = Date.now())
})

proxy.api.Engine.events.on('pipeline.flush.end', () => {
  console.log('end', Date.now() - t)
})


// const instance = AtInstance.create(document.getElementById('webgl'), {
//   width: 400,
//   height: 400,
//   devicePixelRatio: 2
// })

// instance.start(() => {
//   debugger
//   // const surface = App.skia.MakeWebGLCanvasSurface(document.getElementById('webgl') as HTMLCanvasElement)
//   // const canvas = Canvas.create(surface?.getCanvas())
//   // const paint = Paint.create()

//   // debugger

//   // canvas.drawCircle(Offset.create(30, 30), 10, paint)
  
// })