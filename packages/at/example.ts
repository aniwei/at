import { App, At } from './lib'
const app = App.create() as App<''>
app.start(() => {
  const paint = new At.skia.Paint()
  const surface = At.skia.MakeSurface(400, 400)
  const canvas = surface?.getCanvas()

  paint.setStyle(At.skia.PaintStyle.Stroke)
  paint.setStrokeWidth(1)
  paint.setColor([0, 0, 0])

  canvas?.drawRect([0, 0, 100, 100], paint)

  surface?.flush()

  debugger
})