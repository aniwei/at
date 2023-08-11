import { At } from '@at/framework'
import { AtShape, AtShapePainter } from './shape'

export type AtCircleOptions = {
  id: string,
  name: string
}

export class AtCircle extends AtShape {
  static create (options: AtCircleOptions) {
    return new AtCircle(
      options.id,
      options.name,
      AtCirclePainter.create()
    )
  }
}

export class AtCirclePainter extends AtShapePainter {
  static create () {
    return new AtCirclePainter()
  }

  constructor () {
    super()

    this.shape.addRRect(At.RRect.fromRectAndRadius(
      At.Rect.fromLTWH(0, 0, 200, 200),
      At.Radius.circular(100)
    ))
  }
}