import { Offset } from 'packages/geometry/types/lib'
import { BoxHitTestResult, PaintingContext } from '.'
import { Box } from './box'

//// => RepaintBox
export interface RepaintBoxOptions {
  child: Box | null
}

export class RepaintBox extends Box {
  static create (options?: RepaintBoxOptions) {
    return new RepaintBox(
      options?.child
    )
  }

  public isRepaintBoundary: boolean =true

  constructor (
    child: Box | null = null
  ) {
    super([child])
  }

  hitTest(result: BoxHitTestResult, position: Offset): boolean {
    return this.defaultHitTestChildren(result, position)
  }

  paint (context: PaintingContext, offset: Offset): void {
    return this.defaultPaint(context, offset)
  }
}