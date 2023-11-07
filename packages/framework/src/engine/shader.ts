import { invariant } from '@at/utility'
import { At } from '../at'
import { AtManagedSkiaObject } from './skia'
import { matrix4IsValid, offsetIsValid, toColors, toColorStops, toFilterMode, toMatrix, toMipmapMode } from '../basic/helper'

import type { ArrayLike } from '../at'
import type { AtImage } from './image'
import type { Color } from '../basic/color'
import type { Offset } from '../basic/geometry'
import type { FilterQuality, Shader, TileMode } from './skia'

export abstract class AtShader extends AtManagedSkiaObject<Shader> {
  withQuality (contextualQuality: FilterQuality) {
    return this.skia
  }
}

export class AtGradientSweep extends AtShader {
  /**
   * 
   * @param center 
   * @param tileMode 
   * @param startAngle 
   * @param endAngle 
   * @param colors 
   * @param stops 
   * @param matrix4 
   * @returns 
   */
  static resurrect (
    center: Offset, 
    tileMode: TileMode,
    startAngle: number, 
    endAngle: number, 
    colors: ArrayLike<Color>, 
    stops: ArrayLike<number>, 
    matrix4: ArrayLike<number> | null
  ) {
    invariant(colors !== null, `The colors argument cannot be null.`)
    invariant(tileMode !== null, `The tileMode argument cannot be null.`)
    invariant(startAngle !== null, `The startAngle argument cannot be null.`)
    invariant(endAngle !== null, `The endAngle argument cannot be null.`)
    invariant(startAngle < endAngle, `The startAngle cannot be gather than endAngle.`)
    invariant(matrix4 === null || matrix4IsValid(matrix4),  `The matrix4 argument cannot be null.`)

    const degrees = 180 / Math.PI

    return At.Shader.MakeSweepGradient(
      center.dx,
      center.dy,
      toColors(colors),
      toColorStops(stops),
      tileMode,
      matrix4 !== null ? toMatrix(matrix4) : undefined,
      0,
      startAngle * degrees,
      endAngle * degrees,
    )
  }

  protected center: Offset
  protected colors: ArrayLike<Color>
  protected tileMode: TileMode
  protected endAngle: number
  protected startAngle: number
  protected stops: ArrayLike<number>
  protected matrix4: ArrayLike<number> | null

  /**
   * 构造函数
   * @param center 
   * @param tileMode 
   * @param startAngle 
   * @param endAngle 
   * @param colors 
   * @param stops 
   * @param matrix4 
   */
  constructor (
    center: Offset, 
    tileMode: TileMode,
    startAngle: number, 
    endAngle: number, 
    colors: ArrayLike<Color>, 
    stops: ArrayLike<number>, 
    matrix4: ArrayLike<number> | null
  ) {
    super(AtGradientSweep.resurrect(
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
    return AtGradientSweep.resurrect(
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

export class AtGradientLinear extends AtShader {
  /**
   * 
   * @param to 
   * @param from 
   * @param colors 
   * @param stops 
   * @param tileMode 
   * @param matrix4 
   * @returns 
   */
  static resurrect (
    to: Offset,
    from: Offset,
    colors: ArrayLike<Color>,
    stops: ArrayLike<number>,
    tileMode: TileMode,
    matrix4: ArrayLike<number> | null = null
  ) {
    invariant(offsetIsValid(from), `The argument from was invalid.`)
    invariant(offsetIsValid(to), `The argument to was invalid.`)
    invariant(colors !== null, `The argument colors cannot be null.`)
    invariant(tileMode !== null, `The argument colors cannot be null.`)

    return At.Shader.MakeLinearGradient(
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
  protected colors: ArrayLike<Color>
  protected stops: ArrayLike<number>
  protected tileMode: TileMode
  protected matrix4: ArrayLike<number> | null

  /**
   * 构造函数
   * @param from 
   * @param to 
   * @param colors 
   * @param stops 
   * @param tileMode 
   * @param matrix4 
   */
  constructor (
    from: Offset,
    to: Offset,
    colors: ArrayLike<Color>,
    stops: ArrayLike<number>,
    tileMode: TileMode,
    matrix4: ArrayLike<number> | null = null
  ) {
    super(AtGradientLinear.resurrect(
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
    return AtGradientLinear.resurrect(
      this.from,
      this.to,
      this.colors,
      this.stops,
      this.tileMode,
      this.matrix4
    )
  }
}

/**
 * 
 */
export class AtGradientRadial extends AtShader {
  /**
   * 
   * @param center 
   * @param radius 
   * @param tileMode 
   * @param colors 
   * @param stops 
   * @param matrix4 
   * @returns 
   */
  static resurrect (
    center: Offset ,
    radius: number,
    tileMode: TileMode,
    colors: ArrayLike<Color>,
    stops: ArrayLike<number>,
    matrix4: ArrayLike<number> | null
  ) {
    return At.Shader.MakeRadialGradient(
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
  protected tileMode: TileMode
  protected colors: ArrayLike<Color>
  protected stops: ArrayLike<number>
  protected matrix4: ArrayLike<number> | null

  /**
   * 构造函数
   * @param center 
   * @param radius 
   * @param tileMode 
   * @param colors 
   * @param stops 
   * @param matrix4 
   */
  constructor (
    center: Offset ,
    radius: number,
    tileMode: TileMode,
    colors: ArrayLike<Color>,
    stops: ArrayLike<number> = [0, 1],
    matrix4: ArrayLike<number> | null
  ) {
    super(AtGradientRadial.resurrect(
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

  /**
   * 
   * @returns  
   */
  resurrect () {
    return AtGradientRadial.resurrect(
      this.center,
      this.radius,
      this.tileMode,
      this.colors,
      this.stops,
      this.matrix4,
    )
  }
}

export class AtGradientConical extends AtShader {
  /**
   * 
   * @param focal 
   * @param focalRadius 
   * @param center 
   * @param radius 
   * @param colors 
   * @param stops 
   * @param tileMode 
   * @param matrix4 
   * @returns 
   */
  static resurrect (
    focal: Offset,
    focalRadius: number,
    center: Offset ,
    radius: number,
    colors: ArrayLike<Color>,
    stops: ArrayLike<number>,
    tileMode: TileMode,
    matrix4: ArrayLike<number> | null
  ) {
    return At.Shader.MakeTwoPointConicalGradient(
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
  protected tileMode: TileMode
  protected colors: ArrayLike<Color>
  protected stops: ArrayLike<number>
  protected matrix4: ArrayLike<number> | null
  

  /**
   * 构造函数
   * @param {Offset} focal 
   * @param {number} focalRadius 
   * @param {Offset} center 
   * @param {number} radius 
   * @param {ArrayLike<number>} colors 
   * @param {ArrayLike<number>} stops 
   * @param {TileMode} tileMode 
   * @param {ArrayLike<number> | null} matrix4 
   */
  constructor (
    focal: Offset,
    focalRadius: number,
    center: Offset ,
    radius: number,
    colors: ArrayLike<Color>,
    stops: ArrayLike<number>,
    tileMode: TileMode,
    matrix4: ArrayLike<number> | null
  ) {
    super(AtGradientConical.resurrect(
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
    return AtGradientConical.resurrect(
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

export class AtImageShader extends AtShader {
  protected tileModeX: TileMode
  protected tileModeY: TileMode
  protected image: AtImage
  protected filterQuality: FilterQuality
  protected matrix4: ArrayLike<number> | null
  protected cachedQuality: FilterQuality | null = null

  /**
   * @description: 
   * @param {ImageShaderOptions} options
   * @return {ImageShader}
   */  
  constructor (
    image: AtImage,
    tileModeX: TileMode,
    tileModeY: TileMode,
    filterQuality: FilterQuality,
    matrix4: ArrayLike<number> | null
  ) {
    super(image.skia)

    this.image = image
    this.matrix4 = matrix4
    this.tileModeX = tileModeX
    this.tileModeY = tileModeY
    this.filterQuality = filterQuality
  }
  
  /**
   * @description: 
   * @param {FilterQuality} contextualQuality
   * @return {IShader}
   */  
  withQuality (contextualQuality: FilterQuality): Shader {
    const quality = this.filterQuality ?? contextualQuality
    let shader = this.skia
    
    if (this.cachedQuality !== quality || shader === null) {
      if (quality === At.FilterQuality.High) {
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
          toFilterMode(quality),
          toMipmapMode(quality),
          toMatrix(this.matrix4!), 
        )
      }

      this.cachedQuality = quality
      this.skia = shader
    }

    return shader
  }

  /**
   * @description: 
   * @return {Shader}
   */  
  resurrect () {
    return this.withQuality(this.cachedQuality ?? At.FilterQuality.None)!
  } 
}
