import { Offset, Size } from '@at/geometry'
import { Subscribable, Color } from '@at/basic'
import { Path, Paint, Canvas, Skia } from '@at/engine'
import { Gradient } from './gradient'
import { ImageConfiguration } from './image-provider'
import { DecorationImage } from './decoration-image'
import { ShapeShadow, ShapeShadows } from './shadow'



export enum DecorationShape {
  Rectangle,
  Circle,
  Irregular
}

//// => DecorationPainter
export interface DecorationPainterOptions<T extends ShapeShadow> {
  decoration: Decoration<T>, 
  onChange: VoidFunction | null
}

export abstract class DecorationPainter {
  abstract paint (
    canvas: Canvas, 
    decoration: unknown, 
    shape: unknown,
    textDirection: Skia.TextDirection,
    other?: ImageConfiguration | Paint
  ): void

  abstract paint (
    canvas: Canvas, 
    decoration: unknown, 
    shape: unknown,
    textDirection: Skia.TextDirection,
    ...rests: unknown[]
  ): void


  dispose () {}
}

//// => DecorationCompositePainter
// 复合画笔
export abstract class DecorationCompositePainter<T extends ShapeShadow> {
  // => painters
  public get painters (): DecorationPainter[] {
    if (this.cachedBuiltInPainters === null) {
      this.cachedBuiltInPainters = this.createBuiltInPainters()
    }
    return this.cachedBuiltInPainters
  }
  
  // => cachedBuiltInPainters
  // 缓存内部 Painter
  protected cachedBuiltInPainters: DecorationPainter[] | null = null

  public onChange: VoidFunction | null
  // 样式
  public decoration: Decoration<T>

  constructor (
    dectoration: Decoration<T>, 
    onChange: VoidFunction | null
  ) {
    this.onChange = onChange
    this.decoration = dectoration
  }

  // 创建背景色画笔
  abstract createBuiltInBackgroundColorPainter (): DecorationPainter
  // 创建背景图片画笔
  abstract createBuiltInBackgroundImagePainter (onChange: VoidFunction | null): DecorationPainter
  // 创建阴影背景
  abstract createBuiltInShadowsPainter (): DecorationPainter

  createBuiltInPainters () {
    const painters: DecorationPainter[] = []

    if (this.decoration.shadows !== null) {
      painters.push(this.createBuiltInShadowsPainter())
    }

    if (this.decoration.color !== null || this.decoration.gradient !== null) {
      painters.push(this.createBuiltInBackgroundColorPainter())
    }

    if (this.decoration.image !== null) {
      painters.push(this.createBuiltInBackgroundImagePainter(this.onChange))
    }


    this.cachedBuiltInPainters = painters
    return this.cachedBuiltInPainters
  }

  paint (
    canvas: Canvas, 
    decoration: Decoration<T>, 
    shape: unknown,
    textDirection: Skia.TextDirection, 
    configuration: ImageConfiguration
  ) {
    for (const painter of this.painters) {
      painter.paint(
        canvas, 
        decoration, 
        shape,
        textDirection, 
        configuration
      )
    }
  }

  dispose () {
    if (this.cachedBuiltInPainters) {
      for (const painter of this.cachedBuiltInPainters) {
        painter.dispose()
      }
    }

    this.cachedBuiltInPainters = null
  }
}

export abstract class Decoration<T extends ShapeShadow> extends Subscribable {
  // => isComplex
  public get isComplex () {
    return this.shadows !== null
  } 

  // => color
  // 颜色
  private _color: Color | null = null
  public get color (): Color | null {
    return this._color
  }
  public set color (color: Color | null) {
    if (this._color === null || this._color?.notEqual(color)) {
      this._color = color
      this.publish('color', color)
    }
  }

  // => shape
  // 图形
  private _shape: DecorationShape = DecorationShape.Rectangle
  public get shape (): DecorationShape {
    return this._shape
  }
  public set shape (shape: DecorationShape) {
    if (this._shape !== shape) {
      this._shape = shape
      this.publish('shape', shape)
    }
  }
  
  // => image
  // 图片
  private _image: DecorationImage | null = null
  public get image (): DecorationImage | null {
    return this._image
  }
  public set image (image: DecorationImage | null) {
    if (this._image === null || this._image?.notEqual(image)) {
      this._image = image
      this.publish('image', image)
    }
  }

  // => shadows
  // 阴影
  private _shadows: ShapeShadows<T> | null = null
  public get shadows (): ShapeShadows<T> | null {
    return this._shadows
  }
  public set shadows (shadows: ShapeShadows<T> | null) {
    if (this._shadows === null || this._shadows?.notEqual(shadows)) {
      this._shadows = shadows
      this.publish('shadows', shadows)
    }
  }

  // => gradient
  // 渐变
  private _gradient: Gradient | null = null
  public get gradient (): Gradient | null {
    return this._gradient
  }
  public set gradient (gradient: Gradient | null) {
    if (this._gradient === null || this._gradient?.notEqual(gradient)) {
      this._gradient = gradient
      this.publish('gradient', gradient)
    }
  }

  // => backgroundBlendMode
  // 背景混合模式
  private _backgroundBlendMode: Skia.BlendMode | null = null
  public get backgroundBlendMode (): Skia.BlendMode | null {
    return this._backgroundBlendMode
  }
  public set backgroundBlendMode (blendMode: Skia.BlendMode | null) {
    if (this.backgroundBlendMode !== blendMode) {
      this._backgroundBlendMode = blendMode
      this.publish('backgroundBlendMode', blendMode)
    }
  }

  /**
   * 
   * @param color 
   * @param image 
   * @param border 
   * @param shadows 
   * @param gradient 
   * @param shape
   */
  constructor (
    color: Color | null = null,
    image: DecorationImage | null = null,
    shadows: ShapeShadows<T> | null = null,
    gradient: Gradient | null = null,
    backgroundBlendMode: Skia.BlendMode | null,
    shape: DecorationShape = DecorationShape.Rectangle
  ) {
    super()

    this.color = color
    this.image = image
    this.shadows = shadows
    this.gradient = gradient
    this.backgroundBlendMode = backgroundBlendMode
    this.shape = shape
  }

  abstract lerpFrom (a: Decoration<T> | null, t: number): Decoration<T> | null 
  abstract lerpTo (b: Decoration<T> | null, t: number): Decoration<T> | null

  abstract clipPath (
    rect: unknown,
    textDirection: Skia.TextDirection
  ): Path

  abstract scale (factor: number): Decoration<T>
  abstract copyWith (
    color: Color | null,
    image: DecorationImage | null,
    shadows: ShapeShadows<T> | null,
    gradient: Gradient | null,
    backgroundBlendMode: Skia.BlendMode | null,
    shape: DecorationShape,
    ...rest: unknown[]
  ): Decoration<T>

  abstract hitTest (
    size: Size, 
    position: Offset , 
    textDirection: Skia.TextDirection
  ): boolean

  abstract createPainter (onChange: VoidFunction | null): DecorationCompositePainter<T>

  equal (other: Decoration<T> | null): boolean {
    return (
      other instanceof Decoration &&
      !!other.color?.equal(this.color) &&
      other.image === this.image &&
      !!other.gradient?.equal(this.gradient)  &&
      !!other.shadows?.equal(other.shadows)
    )
  }

  notEqual (other: Decoration<T> | null) {
    return !this.equal(other)
  }
}

