import { Paint, Canvas } from '@at/engine'
import { Size } from '@at/geometry'
import { ProxyApp } from './lib/index'

const proxy = ProxyApp.create(document.getElementById('webgl') as HTMLCanvasElement, {
  width:400,
  height: 400,
  devicePixelRatio: window.devicePixelRatio
})

proxy.start(() => {
  // proxy.getDocument()
  // debugger
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