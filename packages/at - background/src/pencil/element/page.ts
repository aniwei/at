import invariant from '@at/utility'
import { Offset, Rect, Size } from '@at/framework'
import { AtElement } from './element'


export class AtPage extends AtElement {
  static create (size: Size = Size.zero) {
    return new AtPage(
      size.width,
      size.height,
    )
  }

  public get frame (): Rect {
    invariant(this.size !== null)
    return this.offset.and(this.size)
  }

  constructor (
    width: number,
    height: number
  ) {
    super()

    this.x = 0
    this.y = 0
    this.width = width
    this.height = height

    this.isRepaintBoundary = true
  } 

  hitTestSelf (position: Offset): boolean {
    return false
  }
}