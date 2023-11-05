import { Paint, Canvas } from '@at/engine'
import { App, At } from './dist'
const app = App.create() as App<''>
app.start(() => {
  const surface = At.skia.MakeWebGLCanvasSurface('webgl')
  const canvas = Canvas.create(surface?.getCanvas())
  debugger
  const paint = Paint.create()

  canvas.drawCircle(10, 10, 10, paint)
  
})