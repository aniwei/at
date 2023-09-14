import { Offset } from '@at/framework'
import { AtElement } from './element'
import { AtElementPainter } from './element-painter'

export class AtShape extends AtElement<AtShapePainter> {
  public get painter (): AtShapePainter  {
    return super.painter as AtShapePainter
  }

  static create (...rests: unknown[]) {
    return new AtShape(AtShapePainter.create())
  }
}

export class AtShapePainter extends AtElementPainter {
  static create () {
    return new AtShapePainter()
  }

  hitTest (position: Offset): boolean {
    if (this.shape.getBounds().contains(position)) {
      return true
    }

    return false
  }
}