import { Paint, Canvas } from '@at/engine'
import { Offset } from '@at/geometry'
import { App, } from './dist'

const app = App.create() as App
app.start(() => {
  const surface = App.skia.MakeWebGLCanvasSurface(document.getElementById('webgl') as HTMLCanvasElement)
  const canvas = Canvas.create(surface?.getCanvas())
  const paint = Paint.create()

  debugger

  canvas.drawCircle(Offset.create(30, 30), 10, paint)
  
})