import invariant from '@at/utils'
import { AtLayoutCustom, Color, Offset, Rect, Size } from '@at/framework'
import { AtInteractiveCompositePainter, AtInteractiveCompositePainterOptions } from './Interactive-painter'

export type AtStageOptions = {
  size: Size,
} & AtInteractiveCompositePainterOptions

export class AtStage extends AtLayoutCustom {
  
  static create (options: AtStageOptions) {
    return new AtStage(
      options.size.width,
      options.size.height,
      options.borderWidth,
      options.borderColor,
      options.anchorWidth,
      options.anchorColor,
      options.anchorBorderColor,
      options.anchorBorderWidth,
    )
  }

  public get frame (): Rect {
    invariant(this.size !== null)
    
    return this.offset.and(this.size)
  }


  constructor (
    width: number,
    height: number,
    borderWidth: number,
    borderColor: Color,
    anchorWidth: number,
    anchorColor: Color,
    anchorBorderColor: Color,
    anchorBorderWidth: number
  ) {
    super([], null, AtInteractiveCompositePainter.create({
      borderWidth,
      borderColor,
      anchorWidth,
      anchorColor,
      anchorBorderColor,
      anchorBorderWidth
    }))

    this.left = 0
    this.top = 0
    this.width = width
    this.height = height

    invariant((() => {
      console.log(`The stage size is ${width} x ${height}`)
      return true
    })())
    
    this.isRepaintBoundary = true
  } 

  hitTestSelf (position: Offset): boolean {
    return false
  }
}

