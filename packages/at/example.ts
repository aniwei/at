import { Paint, Canvas } from '@at/engine'
import { Offset } from '@at/geometry'
import { App, At } from './dist'
const app = App.create() as App<''>
app.start(() => {
  const surface = At.skia.MakeWebGLCanvasSurface(document.getElementById('webgl'))
  const canvas = Canvas.create(surface?.getCanvas())
  const paint = Paint.create()

  canvas.drawCircle(Offset.create(30, 30), 10, paint)
  
})