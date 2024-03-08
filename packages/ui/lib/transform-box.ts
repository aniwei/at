import { Skia, TransformLayer } from '@at/engine'
import { invariant } from '@at/utils'
import { Alignment, AlignmentGeometry } from '@at/painting'
import { Offset } from '@at/geometry'
import { Matrix4, MatrixUtils } from '@at/math'
import { BoxHitTestResult } from './box-hit-test'
import { PaintingContext } from './painting-context'
import { Box } from './box'

//// => TransformBox
export interface TransformBoxOptions {
  child: Box | null,
  transform?: Matrix4,
  origin?: Offset | null,
  alignment?: AlignmentGeometry | null,
  textDirection?: Skia.TextDirection | null,
  transformHitTests?: boolean,
  quality?: Skia.FilterQuality,
}

export class TransformBox extends Box {
  /**
   * 创建 TransformBox 对象
   * @param {TransformBoxOptions} options 
   * @returns {TransformBox}
   */
  static create (options?: TransformBoxOptions) {
    return new TransformBox(
      options?.child,
      options?.transform,
      options?.origin,
      options?.alignment,
      options?.textDirection,
      options?.transformHitTests,
      options?.quality,
    )
  }

  // => origin
  // 原点
  protected _origin: Offset | null = null 
  public get origin () {
    return this._origin
  }
  public set origin (origin: Offset | null) {
    if (
      this._origin === null || 
      this.origin?.notEqual(origin)
    ) {
      this._origin = origin
      this.markNeedsPaint()
    }
  }
  
  // => alignment
  // 布局方式
  protected _alignment: AlignmentGeometry | null = null
  public get alignment () {
    return this._alignment
  }
  public set alignment (alignment: AlignmentGeometry | null) {
    if (
      this._alignment === null ||
      this._alignment === alignment
    ) {
      this._alignment = alignment
      this.markNeedsPaint()
    }
  }

  // => textDirection
  // 文字布局方式
  protected _textDirection: Skia.TextDirection | null = null
  public get textDirection () {
    return this._textDirection
  }
  public set textDirection (textDirection: Skia.TextDirection | null) {
    if (
      this._textDirection === null || 
      this._textDirection !== textDirection
    ) {
      this._textDirection = textDirection
      this.markNeedsPaint()
    }
  }

  // => quality
  protected _quality: Skia.FilterQuality | null = null
  public get quality () {
    return this._quality
  }
  public set quality (quality: Skia.FilterQuality | null) {
    if (
      this._quality === null || 
      this._quality !== quality
    ) {
      const didNeedCompositing = this.alwaysNeedsCompositing
      this._quality = quality
      if (didNeedCompositing != this.alwaysNeedsCompositing) {
        this.markNeedsCompositingBitsUpdate()
      }

      this.markNeedsPaint()
    }
  }

  // => effectiveTransform
  public get effectiveTransform (): Matrix4 | null {
    const resolvedAlignment: Alignment | null = this.alignment?.resolve(this.textDirection) ?? null
    
    if (this.origin === null && resolvedAlignment === null) {
      return this.transform
    }

    const result = Matrix4.identity()
    if (this.origin !== null) {
      result.translate(this.origin.dx, this.origin.dy)
    }

    let translation: Offset | null = null
    if (resolvedAlignment !== null) {
      invariant(this.size, 'The "TransformBox.size" cannot be null.')
      translation = resolvedAlignment.alongSize(this.size)
      result.translate(translation.dx, translation.dy)
    }

    result.multiply(this.transform)

    if (resolvedAlignment !== null) {
      invariant(translation !== null)
      result.translate(-translation.dx, -translation.dy)
    }

    if (this.origin !== null) {
      result.translate(-this.origin.dx, -this.origin.dy)
    }

    return result
  }

  // => alwaysNeedsCompositing
  public get alwaysNeedsCompositing () {
    return this.child !== null && this.quality !== null
  }

  public transformHitTests: boolean

  constructor (
    child: Box | null = null,
    transform: Matrix4 = Matrix4.identity(),
    origin: Offset | null = null,
    alignment: AlignmentGeometry | null = null,
    textDirection: Skia.TextDirection | null = null,
    transformHitTests: boolean = true,
    quality: Skia.FilterQuality | null = null,
  ) {
    super([child]) 
    
    this.transform = transform;
    this.alignment = alignment
    this.textDirection = textDirection
    this.quality = quality
    this.origin = origin
    this.transformHitTests = transformHitTests
  }

  identity () {
    this.transform.identity()
    this.markNeedsPaint()
  }

  rotateX (r: number) {
    this.transform.rotateX(r)
    this.markNeedsPaint()
  }

  rotateY (r: number) {
    this.transform!.rotateY(r)
    this.markNeedsPaint()
  }

  rotateZ (r: number) {
    this.transform.rotateZ(r)
    this.markNeedsPaint()
  }

  translate (
    x: number, 
    y: number = 0.0, 
    z: number = 0.0
  ) {
    this.transform.translate(x, y, z)
    this.markNeedsPaint()
  }

  scaleX (x: number) {
    this.transform.scale(x)
    this.markNeedsPaint()
  }

  hitTest (result: BoxHitTestResult, position: Offset) {
    return this.hitTestChildren(result, position)
  }

  hitTestChildren (
    result: BoxHitTestResult, 
    position: Offset
  ) {
    return result.addWithPaintTransform(
      this.transformHitTests 
        ? this.effectiveTransform 
        : null,
      position,
      (result: BoxHitTestResult, position: Offset) => {
        return this.defaultHitTestChildren(result, position)
      },
    )
  }

  paint (context: PaintingContext, offset: Offset) {
    if (this.child !== null) {
      const transform = this.effectiveTransform as Matrix4
      if (this.quality === null) {
        const childOffset = MatrixUtils.getAsTranslation(transform)
        if (childOffset == null) {
          this.layer = context.pushTransform(
            this.needsCompositing,
            offset,
            transform,
            (context: PaintingContext, offset: Offset) => this.defaultPaint(context, offset),
            this.layer as TransformLayer
          )
        } else {
          this.defaultPaint(context, offset.add(childOffset))
          this.layer = null
        }
      } else {
        const effectiveTransform = Matrix4.translationValues(offset.dx, offset.dy, 0.0) ?? null
        effectiveTransform.multiply(transform)
        effectiveTransform.translate(-offset.dx, -offset.dy)
        
        // const filter = Engine.skia.ImageFilter.matrix(
        //   effectiveTransform,
        //   this.quality,
        // )

        // const layer = ImageFilterLayer.create({ filter })
        // context.pushLayer(layer, super.paint, offset)
      }
    }
  }

  /**
   * 
   * @param {Box} child 
   * @param {Matrix4} transform 
   */
  applyPaintTransform (
    child: Box, 
    transform: Matrix4
  ) {
    const effectiveTransform = this.effectiveTransform ?? null
    invariant(effectiveTransform)
    transform.multiply(effectiveTransform)
  }
}
