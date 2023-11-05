import { Paint, Canvas } from '@at/engine'
import { App, At } from './lib'
const app = App.create() as App<''>
app.start(() => {
  const surface = At.skia.MakeWebGLCanvasSurface('webgl')
  const canvas = Canvas.create(surface?.getCanvas())
  const paint = Paint.create()

  debugger
  canvas.drawCircle(10, 10, 10, paint)
  
})