
import { Radius } from '@at/framework'
import { AtRectangle, AtRectanglePainter } from './rectangle'

export type AtFrameOptions = {
  id: string,
  name: string,
  width?: number,
  height?: number,
  radius?: Radius,
}

export class AtFrame extends AtRectangle {
  static create (options: AtFrameOptions) {
    return new AtFrame(
      options.id,
      options.name,
      AtFramePainter.create(
        options.width,
        options.height,
        options.radius
      )
    )
  }
}

export class AtFramePainter extends AtRectanglePainter {
  static create (
    width: number = 100.0,
    height: number = 100.0,
    radius: Radius = Radius.zero
  ) {
    return new AtFramePainter(
      width,
      height, 
      radius
    )
  }
}