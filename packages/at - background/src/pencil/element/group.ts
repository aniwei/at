
import { Radius } from '@at/framework'
import { AtRectangle, AtRectanglePainter } from './rectangle'

export type AtGroupOptions = {
  id: string,
  name: string,
  width?: number,
  height?: number,
  radius?: Radius,
}

export class AtGroup extends AtRectangle {
  static create (options: AtGroupOptions) {
    return new AtGroup(
      options.id,
      options.name,
      AtGroupPainter.create(
        options.width,
        options.height,
        options.radius
      )
    )
  }
}

export class AtGroupPainter extends AtRectanglePainter {
  static create (
    width: number = 100.0,
    height: number = 100.0,
    radius: Radius = Radius.zero
  ) {
    return new AtGroupPainter(
      width,
      height, 
      radius
    )
  }
}