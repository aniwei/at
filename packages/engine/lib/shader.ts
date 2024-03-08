import { invariant } from '@at/utils'
import { Offset, offsetIsValid } from '@at/geometry'
import { Color } from '@at/basic'
import { Engine } from './engine'
import { Image } from './image'
import { 
  toColors, 
  toColorStops, 
  toFilterMode, 
  toMatrix, 
  toMipmapMode,
} from './to'


import * as Skia from './skia'

//// => Shader
// 
export abstract class Shader extends Skia.ManagedSkiaRef<Skia.Shader> {
  // => skia
  public get skia () {
    invariant(super.skia)
    return super.skia
  }
  public set skia (skia: Skia.Shader) {
    super.skia = skia
  }

  withQuality (quality: Skia.FilterQuality) {
    return this.skia
  }
}

//// =>GradientSweep
export interface GradientSweepOptions {
  center: Offset, 
  tileMode: Skia.TileMode,
  startAngle: number, 
  endAngle: number, 
  colors: Color[], 
  stops: number[], 
  matrix4: number[] | null
}

// 渐变
export class GradientSweep extends Shader {
  static create (options: GradientSweepOptions) {
    return new GradientSweep(
      options.center,
      options.tileMode,
      options.startAngle,
      options.endAngle,
      options.colors,
      options.stops,
      options.matrix4,
    )
  }

  /**
   * 
   * @param {Offset} center 
   * @param {Skia.TileMode} tileMode 
   * @param {number} startAngle 
   * @param {number} endAngle 
   * @param {Color[]} colors 
   * @param {number[]} stops 
   * @param {number[]} matrix4 
   */
  static resurrect (
    center: Offset, 
    tileMode: Skia.TileMode,
    startAngle: number, 
    endAngle: number, 
    colors: Color[], 
    stops: number[], 
    matrix4: number[] | null
  ) {
    
    invariant(matrix4 === null,  `The argument "matrix4" cannot be null.`)
    const degrees = 180.0 / Math.PI

    return Engine.skia.Shader.MakeSweepGradient(
      center.dx,
      center.dy,
      toColors(colors),
      toColorStops(stops),
      tileMode,
      matrix4 !== null ? toMatrix(matrix4) : null,
      0,
      startAngle * degrees,
      endAngle * degrees,
    )
  }

  protected center: Offset
  protected colors: Color[]
  protected endAngle: number
  protected startAngle: number
  protected stops: number[]
  protected tileMode: Skia.TileMode
  protected matrix4: number[] | null

  /**
   * 构造函数
   * @param {Offset} center 
   * @param {Skia.TileMode} tileMode 
   * @param {number} startAngle 
   * @param {number} endAngle 
   * @param {Color[]} colors 
   * @param {number[]} stops 
   * @param {number[]} matrix4 
   */
  constructor (
    center: Offset, 
    tileMode: Skia.TileMode,
    startAngle: number, 
    endAngle: number, 
    colors: Color[], 
    stops: number[], 
    matrix4: number[] | null
  ) {
    super(GradientSweep.resurrect(
      center,
      tileMode,
      startAngle,
      endAngle,
      colors,
      stops,
      matrix4,  
    ))

    this.center = center
    this.colors = colors
    this.stops = stops
    this.tileMode = tileMode
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.matrix4 = matrix4
  }  

  /**
   * 
   */
  resurrect () {
    return GradientSweep.resurrect(
      this.center,
      this.tileMode,
      this.startAngle,
      this.endAngle,
      this.colors,
      this.stops,
      this.matrix4,  
    )
  }
}


//// => GradientLinear
// 线性渐变
export interface GradientLinearOptions {
  to: Offset,
  from: Offset,
  colors: Color[],
  stops: number[],
  tileMode: Skia.TileMode,
  matrix4?: number[] | null
}

export class GradientLinear extends Shader {
  static create (options: GradientLinearOptions) {
    return new GradientLinear(
      options.to,
      options.from,
      options.colors,
      options.stops,
      options.tileMode,
      options.matrix4,
    )
  }

  /**
   * 创建 skia 对象
   * @param {Offset} to 
   * @param {Offset} from 
   * @param {Color[]} colors 
   * @param {number[]} stops 
   * @param {Skia.TileMode} tileMode 
   * @param {number[]} matrix4 
   * @returns 
   */
  static resurrect (
    to: Offset,
    from: Offset,
    colors: Color[],
    stops: number[],
    tileMode: Skia.TileMode,
    matrix4: number[] | null = null
  ) {
    invariant(offsetIsValid(from), `The argument from was invalid.`)
    invariant(offsetIsValid(to), `The argument to was invalid.`)
    
    return Engine.skia.Shader.MakeLinearGradient(
      from,
      to,
      toColors(colors),
      toColorStops(stops),
      tileMode,
      matrix4 !== null ? toMatrix(matrix4) : undefined,
    )
  }

  protected to: Offset
  protected from: Offset
  protected colors: Color[]
  protected stops: number[]
  protected tileMode: Skia.TileMode
  protected matrix4: number[] | null

   /**
   * 构造函数
   * @param {Offset} to 
   * @param {Offset} from 
   * @param {Color[]} colors 
   * @param {number[]} stops 
   * @param {Skia.TileMode} tileMode 
   * @param {number[] | null} matrix4 
   * @returns 
   */
  constructor (
    from: Offset,
    to: Offset,
    colors: Color[],
    stops: number[],
    tileMode: Skia.TileMode,
    matrix4: number[] | null = null
  ) {
    super(GradientLinear.resurrect(
      from,
      to,
      colors,
      stops,
      tileMode,
      matrix4,
    ))

    this.to = to
    this.from = from
    this.colors = colors
    this.stops = stops
    this.tileMode = tileMode
    this.matrix4 = matrix4
  }

  /**
   * 创建 Skia
   * @returns 
   */
  resurrect () {
    return GradientLinear.resurrect(
      this.from,
      this.to,
      this.colors,
      this.stops,
      this.tileMode,
      this.matrix4
    )
  }
}

//// => GradientRadial
export interface GradientRadialOptions {
  center: Offset ,
  radius: number,
  tileMode: Skia.TileMode,
  colors: Color[],
  stops: number[],
  matrix4: number[] | null
}

/**
 * 
 */
export class GradientRadial extends Shader {
  static create (options: GradientRadialOptions) {
    return new GradientRadial(
      options.center,
      options.radius,
      options.tileMode,
      options.colors,
      options.stops,
      options.matrix4,
    )
  }

  /**
   * 
   * @param {Offset} center 
   * @param {number} radius 
   * @param {Skia.TileMode} tileMode 
   * @param {Color[]} colors 
   * @param {number[]} stops 
   * @param {number[]} matrix4 
   * @returns 
   */
  static resurrect (
    center: Offset ,
    radius: number,
    tileMode: Skia.TileMode,
    colors: Color[],
    stops: number[],
    matrix4: number[] | null = null
  ) {
    return Engine.skia.Shader.MakeRadialGradient(
      center,
      radius,
      toColors(colors),
      toColorStops(stops),
      tileMode,
      matrix4 !== null ? toMatrix(matrix4!) : undefined,
      0,
    )
  }

  protected center: Offset 
  protected radius: number
  protected tileMode: Skia.TileMode
  protected colors: Color[]
  protected stops: number[]
  protected matrix4: number[] | null

  /**
   * 
   * @param {Offset} center 
   * @param {number} radius 
   * @param {Skia.TileMode} tileMode 
   * @param {Color[]} colors 
   * @param {number[]} stops 
   * @param {number[]} matrix4 
   * @returns 
   */
  constructor (
    center: Offset ,
    radius: number,
    tileMode: Skia.TileMode,
    colors: Color[],
    stops: number[] = [0, 1],
    matrix4: number[] | null
  ) {
    super(GradientRadial.resurrect(
      center,
      radius,
      tileMode,
      colors,
      stops,
      matrix4,
    ))

    this.center = center
    this.radius = radius
    this.tileMode = tileMode
    this.matrix4 = matrix4
    this.colors = colors
    this.stops = stops
  }

  resurrect () {
    return GradientRadial.resurrect(
      this.center,
      this.radius,
      this.tileMode,
      this.colors,
      this.stops,
      this.matrix4,
    )
  }
}

//// => GradientConical
export interface GradientConicalOptions {
  focal: Offset,
  focalRadius: number,
  center: Offset ,
  radius: number,
  colors: Color[],
  stops: number[],
  tileMode: Skia.TileMode,
  matrix4: number[] | null
}

export class GradientConical extends Shader {
  static create (options: GradientConicalOptions) {
    return new GradientConical(
      options.focal,
      options.focalRadius,
      options.center,
      options.radius,
      options.colors,
      options.stops,
      options.tileMode,
      options.matrix4,
    )
  }

  /**
   * 构造函数
   * @param {Offset} focal 
   * @param {number} focalRadius 
   * @param {Offset} center 
   * @param {number} radius 
   * @param {number[]} colors 
   * @param {number[]} stops 
   * @param {TileMode} tileMode 
   * @param {number[] | null} matrix4 
   */
  static resurrect (
    focal: Offset,
    focalRadius: number,
    center: Offset ,
    radius: number,
    colors: Color[],
    stops: number[],
    tileMode: Skia.TileMode,
    matrix4: number[] | null
  ) {
    return Engine.skia.Shader.MakeTwoPointConicalGradient(
      focal,
      focalRadius,
      center,
      radius,
      toColors(colors),
      toColorStops(stops),
      tileMode,
      matrix4 !== null ? toMatrix(matrix4) : undefined
    )
  }

  protected focal: Offset
  protected focalRadius: number
  protected center: Offset 
  protected radius: number
  protected tileMode: Skia.TileMode
  protected colors: Color[]
  protected stops: number[]
  protected matrix4: number[] | null
  

  /**
   * 构造函数
   * @param {Offset} focal 
   * @param {number} focalRadius 
   * @param {Offset} center 
   * @param {number} radius 
   * @param {number[]} colors 
   * @param {number[]} stops 
   * @param {TileMode} tileMode 
   * @param {number[] | null} matrix4 
   */
  constructor (
    focal: Offset,
    focalRadius: number,
    center: Offset ,
    radius: number,
    colors: Color[],
    stops: number[],
    tileMode: Skia.TileMode,
    matrix4: number[] | null
  ) {
    super(GradientConical.resurrect(
      focal,
      focalRadius,
      center,
      radius,
      colors,
      stops,
      tileMode,
      matrix4,
    ))

    this.focal = focal
    this.focalRadius = focalRadius
    this.center = center
    this.radius = radius
    this.colors = colors
    this.stops = stops
    this.tileMode = tileMode
    this.matrix4 = matrix4
  }

  /**
   * 
   * @returns 
   */
  resurrect () {
    return GradientConical.resurrect(
      this.focal,
      this.focalRadius,
      this.center,
      this.radius,
      this.colors,
      this.stops,
      this.tileMode,
      this.matrix4,
    )
  }
}

//// => ImageShaderOptions
export interface ImageShaderOptions {
  image: Image,
  tileModeX: Skia.TileMode,
  tileModeY: Skia.TileMode,
  quality: Skia.FilterQuality,
  matrix4: number[] | null
}

export class ImageShader extends Shader {
  static create (options: ImageShaderOptions) {
    return new ImageShader(
      options.image,
      options.tileModeX,
      options.tileModeY,
      options.quality,
      options.matrix4,
    )
  }

  protected tileModeX: Skia.TileMode
  protected tileModeY: Skia.TileMode
  protected image: Image
  protected quality: Skia.FilterQuality
  protected matrix4: number[] | null
  protected cachedQuality: Skia.FilterQuality | null = null

  /**
   * @description: 
   * @param {ImageShaderOptions} options
   * @return {ImageShader}
   */  
  constructor (
    image: Image,
    tileModeX: Skia.TileMode,
    tileModeY: Skia.TileMode,
    quality: Skia.FilterQuality,
    matrix4: number[] | null
  ) {
    super(image.skia)

    this.image = image
    this.matrix4 = matrix4
    this.tileModeX = tileModeX
    this.tileModeY = tileModeY
    this.quality = quality
  }
  
  /**
   * @param {FilterQuality} quality
   * @return {IShader}
   */  
  withQuality (quality: Skia.FilterQuality): Skia.Shader {
    const q = this.quality ?? quality
    let shader = this.skia
    
    if (this.cachedQuality !== q || shader === null) {
      if (q === Engine.skia.FilterQuality.High) {
        shader = this.image.skia.makeShaderCubic(
          this.tileModeX,
          this.tileModeY,
          1 / 3,
          1 / 3,
          toMatrix(this.matrix4!),
        )
      } else {
        shader = this.image.skia.makeShaderOptions(
          this.tileModeX,
          this.tileModeY,
          toFilterMode(q),
          toMipmapMode(q),
          toMatrix(this.matrix4!), 
        )
      }

      this.cachedQuality = quality
      this.skia = shader
    }

    return shader
  }

  /**
   * @return {Shader}
   */  
  resurrect () {
    return this.withQuality(this.cachedQuality ?? Engine.skia.FilterQuality.None)
  } 
}
