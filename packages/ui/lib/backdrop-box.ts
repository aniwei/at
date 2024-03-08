import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { Engine, Skia } from '@at/engine'
import { BackdropFilterLayer, ImageFilter } from '@at/engine'
import { PaintingContext } from './painting-context'
import { Box } from './box'

//// => BackdropBox
export interface BackdropBoxOptions {
  child: Box,
  filter: ImageFilter,
  blendMode?: Skia.BlendMode
}

export class BackdropBox extends Box {
  static create (options: BackdropBoxOptions) {
    return new BackdropBox(
      options.child,
      options.filter,
      options.blendMode
    )
  }

  // => layer
  // 渲染层
  public get layer () {
    return super.layer as BackdropFilterLayer
  }
  public set layer (layer: BackdropFilterLayer | null) {
    super.layer = layer
  }

  // => filter
  protected _filter: ImageFilter | null = null
  public get filter () {
    invariant(this._filter !== null, 'The "Backdrop._filter" cannot be null.')
    return this._filter
  }
  public set filter (filter: ImageFilter) {
    invariant(filter !== null, 'The argument "filter" cannot be null.')

    if (this._filter !== filter) {
      this._filter = filter
      this.markNeedsPaint()
    }  
  }

  // => blendMode
  protected _blendMode: Skia.BlendMode = Engine.skia.BlendMode.SrcOver
  public get blendMode () {
    invariant(this._blendMode !== null)
    return this._blendMode
  }
  public set blendMode (blendMode: Skia.BlendMode) {
    invariant(blendMode !== null, 'The  argument "blendMode" cannot be null.')

    if (this._blendMode !== blendMode) {
      this._blendMode = blendMode
      this.markNeedsPaint()
    }  
  }

  // => alwaysNeedsCompositing
  public get alwaysNeedsCompositing () {
    return this.child !== null
  }

  constructor (
    child: Box | null, 
    filter: ImageFilter, 
    blendMode: Skia.BlendMode = Engine.skia.BlendMode.SrcOver 
  ) {
    super([child])
    this.filter = filter
    this.blendMode = blendMode
  }

  /**
   * 绘制
   * @param {PaintingContext} context 
   * @param {Offset} offset 
   */
  paint (
    context: PaintingContext, 
    offset: Offset
  ) {
    if (this.child !== null) {
      invariant(this.needsCompositing, 'The "BackdropBox.needsCompositing" cannt be false.')

      this.layer ??= BackdropFilterLayer.create(
        this.filter,
        this.blendMode
      )
      
      context.pushLayer(
        this.layer, 
        (context: PaintingContext, offset: Offset) => this.defaultPaint(context, offset), 
        offset
      )
    } else {
      this.layer = null
    }
  }
}
