import { invariant } from '@at/utils'
import { Color } from '@at/basic'
import { Offset } from '@at/geometry'
import { OpacityLayer } from '@at/engine'
import { PaintingContext } from './painting-context'
import { Box } from './box'

//// => OpacityBox
export interface OpacityBoxOptions {
  child: Box,
  opacity: number
}

export class OpacityBox extends Box {
  /**
   * 创建 OpacityBox 对象
   * @param {OpacityBoxOptions} options 
   * @returns {OpacityBox}
   */
  static create (options: OpacityBoxOptions) {
    return new OpacityBox(
      options.child,
      options.opacity
    )
  }

  // => opacity
  protected _opacity: number = 1.0
  public get opacity () {
    return this._opacity
  }
  public set opacity (opacity: number) {
    invariant(opacity >= 0.0 && opacity <= 1.0)
    if (this._opacity !== opacity) {
      const didNeedCompositing = this.alwaysNeedsCompositing
      this._opacity = opacity
      this.alpha = Color.computeAlphaFromOpacity(this._opacity)

      if (didNeedCompositing !== this.alwaysNeedsCompositing) {
        this.markNeedsCompositingBitsUpdate()
      }
      this.markNeedsPaint()
    }      
  }


  // => alwaysNeedsCompositing
  // 总是合成
  public  get alwaysNeedsCompositing () {
    return this.child !== null && (this.alpha > 0)
  }
  
  public alpha: number

  constructor (
    child: Box,
    opacity: number = 1.0,
  ) {
    super([child])
    invariant(opacity >= 0.0, 'The argument "opacity" must be gather then zero.')
    
    this.opacity = opacity
    this.alpha = Color.computeAlphaFromOpacity(opacity)
  }

  /**
   * 绘制
   * @param {PaintingContext} context 
   * @param {Offset} offset 
   * @returns 
   */
  paint (context: PaintingContext, offset: Offset) {
    if (this.child !== null) {
      if (this.alpha === 0) {
        this.layer = null
        return
      }

      invariant(this.needsCompositing, 'The "OpacityBox.needsCompositing" cannot be "false".')
      this.layer = context.pushOpacity(
        offset, 
        this.alpha, 
        (context: PaintingContext, offset: Offset) => this.defaultPaint(context, offset), 
        this.layer as OpacityLayer
      )
    }
  }
}
