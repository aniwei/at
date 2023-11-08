import { invariant } from '@at/utils'
import { Matrix4 } from '../basic/matrix4'
import { Color } from '../basic/color'
import { Offset, Rect } from '../basic/geometry'
import { listEquals, lerp } from '../basic/helper'
import { AtGradientConical, AtGradientLinear, AtGradientRadial, AtGradientSweep, AtShader } from '../engine/shader'

import { At } from '../at'
import { AtAlignment, AtAlignmentGeometry } from './alignment'

import type { ArrayLike } from '../at'
import type { TextDirection, TileMode } from '../engine/skia'



export type ColorsAndStops = {
  colors: ArrayLike<Color>
  stops: ArrayLike<number>
}

/**
 * 
 * @param colors 
 * @param stops 
 * @param t 
 * @returns 
 */
function sample (
  colors: ArrayLike<Color>, 
  stops: ArrayLike<number>, 
  t: number
): Color {
  invariant(colors !== null, `The argument colors cannot be null.`)
  invariant(colors.length !== 0, `The argument "colors" length cannot be zero.`)
  invariant(stops !== null, `The argument "colors" cannot be null.`)
  invariant(stops.length !== 0, `The argument "stops" length cannot be zero.`)
  invariant(t !== null, `The argument "t" cannot be null.`)

  if (t <= stops[0]) {
    return colors[0] as Color
  }

  if (t >= stops[stops.length - 1]) {
    return colors[stops.length -1] as Color
  }

  const index = Array.from(stops).findIndex((s: number) => s <= t)
  invariant(index !== -1, `The "index" cannot be -1.`)

  return Color.lerp(
    colors[index] as Color, 
    colors[index + 1] as Color,
    (t - stops[index]) / (stops[index + 1] - stops[index]),
  ) as Color
}

/**
 * @description: 
 * @param {Color} aColors
 * @param {number} aStops
 * @param {Color} bColors
 * @param {number} bStops
 * @param {number} t
 * @return {*}
 */
function interpolateColorsAndStops (
  aColors: ArrayLike<Color>,
  aStops: ArrayLike<number>,
  bColors: ArrayLike<Color>,
  bStops: number[],
  t: number,
): ColorsAndStops {
  invariant(aColors.length >= 2, ``)
  invariant(bColors.length >= 2, ``)
  invariant(aStops.length === aColors.length, ``)
  invariant(bStops.length === bColors.length, ``)

  const stops = new Set<number>([...(aStops as Array<number>), ...bStops])
  const interpolatedStops: number[] = Array.from(stops).sort()
  // @TODO
  const interpolatedColors: Color[] = interpolatedStops.map<Color>((stop: number) => {
    return Color.lerp(
      sample(aColors, aStops, stop), 
      sample(bColors, bStops, stop), 
      t
    )!
  })
  
  return {
    colors: interpolatedColors, 
    stops: interpolatedStops
  }
}

export abstract class AtGradientTransform {
  abstract transform (
    bounds: Rect, 
    textDirection?: TextDirection | null
  ): Matrix4 | null
}

export class AtGradientRotation extends AtGradientTransform {
  public radians: number

  constructor (radians: number) {
    super()
    this.radians = radians
  }

  transform (
    bounds: Rect, 
    textDirection?: TextDirection | null
  ): Matrix4 {
    invariant(bounds !== null)

    const sinRadians: number = Math.sin(this.radians)
    const oneMinusCosRadians: number = 1 - Math.cos(this.radians)
    const center: Offset = bounds.center
    const originX: number = sinRadians * center.dy + oneMinusCosRadians * center.dx
    const originY: number = -sinRadians * center.dx + oneMinusCosRadians * center.dy

    const matrix = Matrix4.identity()
    matrix.translate(originX, originY)
    matrix.rotateZ(this.radians)

    return matrix
  }

  equal (other: AtGradientRotation) {
    return (
      other instanceof AtGradientRotation && 
      other.radians === this.radians
    )
  }

  toString () {
    return `GradientRotation(...)`
  }
}

/**
 * @description: 渐变抽象类
 */
export abstract class AtGradient {

  static linear (
    from: Offset,
    to: Offset ,
    colors: ArrayLike<Color>, 
    stops: ArrayLike<number> = [],
    tileMode: TileMode = At.TileMode.Clamp,
    matrix4: ArrayLike<number> | null = null,
  ) {
    return new AtGradientLinear(
      from, 
      to, 
      colors, 
      stops, 
      tileMode, 
      matrix4
    )
  }

  static radial (
    center: Offset,
    radius: number,
    colors: ArrayLike<Color>, 
    stops: ArrayLike<number>,
    tileMode: TileMode = At.TileMode.Clamp,
    matrix4: ArrayLike<number> | null = null,
    focal: Offset | null,
    focalRadius: number = 0,
  ) {
    if (focal === null || (focal === center && focalRadius === 0)) {
      return new AtGradientRadial(
        center, 
        radius, 
        tileMode, 
        colors, 
        stops, 
        matrix4
      )
    } else {
      invariant(center.notEqual(Offset.zero) || focal.notEqual(Offset.zero), ``)
      
      return new AtGradientConical(
        focal, 
        focalRadius, 
        center, 
        radius, 
        colors,
        stops, 
        tileMode, 
        matrix4
      )
    }
  }

  static sweep (
    center: Offset,
    colors: Color[], 
    stops: ArrayLike<number>,
    tileMode: TileMode = At.TileMode.Clamp,
    startAngle: number = 0.0,
    endAngle: number = Math.PI * 2,
    matrix4: ArrayLike<number> | null,
  ) {
    return new AtGradientSweep(
      center,
      tileMode,
      startAngle,
      endAngle,
      colors,
      stops,
      matrix4
    )    
  }

  /**
   * 
   * @param a 
   * @param b 
   * @param t 
   * @returns 
   */
  static lerp (a: AtGradient | null, b: AtGradient | null, t: number): AtGradient | null {
    invariant(t !== null, `The argument t cannot be null.`)
    let result: AtGradient | null = null

    if (b !== null) {
      result = b.lerpFrom(a, t)
    }
    
    if (result === null && a !== null) {
      result = a.lerpTo(b, t)
    }
    
    if (result !== null) {
      return result
    }

    if (a === null && b === null) {
      return null
    }
    
    invariant(a !== null && b !== null)

    return t < 0.5 
      ? a.scale(1.0 - (t * 2.0)) 
      : b.scale((t - 0.5) * 2.0)
  }

  public colors: ArrayLike<Color>
  public stops: ArrayLike<number> | null
  public transform: AtGradientTransform | null
  
  constructor (
    colors: ArrayLike<Color>,
    stops: ArrayLike<number> | null,
    transform: AtGradientTransform | null
  ) {
    this.colors = colors
    this.stops = stops
    this.transform = transform
  }

  impliedStops (): number[] {
    if (this.stops !== null) {
      return this.stops as Array<number>
    }

    invariant(this.colors.length >= 2, 'Colors list must have at least two colors')
    const separation = 1.0 / (this.colors.length - 1)

    const array: number[] = []

    for (let i = 0; i< this.colors.length; i++) {
      array.push(i * separation)
    }

    return array
  }

  abstract createShader (
    rect: unknown, 
    textDirection: TextDirection | null
  ): AtShader
  
  abstract scale (factor: number): AtGradient
  
  lerpFrom (a: AtGradient | null, t: number): AtGradient | null {
    if (a === null) {
      return this.scale(t)
    }
    return null
  }

  lerpTo (
    b: AtGradient | null, 
    t: number
  ): AtGradient | null {
    if (b === null) {
      return this.scale(1.0 - t)
    }
    return null
  }

  /**
   * 
   * @param bounds 
   * @param textDirection 
   * @returns 
   */
  resolveTransform (
    bounds: Rect, 
    textDirection?: TextDirection | null
  ) {
    return this.transform?.transform(
      bounds, 
      textDirection
    ) ?? null
  }

  abstract equal (gradient: AtGradient | null): boolean
  abstract notEqual (gradient: AtGradient | null): boolean 
}


export type AtLinearGradientOptions = {
  begin?: AtAlignmentGeometry,
  end?: AtAlignmentGeometry,
  colors: ArrayLike<Color>,
  stops: ArrayLike<number> | null,
  tileMode: TileMode,
  transform?: AtGradientTransform | null
}

// 线性渐变
export class AtLinearGradient extends AtGradient {

  static create (options: AtLinearGradientOptions) {
    return new AtLinearGradient(
      options.begin,
      options.end,
      options.colors,
      options.stops,
      options.tileMode,
      options.transform
    )
  } 

  public begin: AtAlignmentGeometry
  public end: AtAlignmentGeometry
  public tileMode: TileMode

  constructor (
    begin: AtAlignmentGeometry = AtAlignment.centerLeft,
    end: AtAlignmentGeometry = AtAlignment.centerRight,
    colors: ArrayLike<Color>,
    stops: ArrayLike<number> | null,
    tileMode: TileMode,
    transform: AtGradientTransform | null = null
  ) {
    invariant(begin !== null, `The argument begin cannot be null.`)
    invariant(end !== null, `The argument end cannot be null.`)
    invariant(tileMode !== null, `The argument tileMode cannot be null.`)

    super(
      colors,
      stops,
      transform
    )

    this.begin = begin
    this.end = end
    this.tileMode = tileMode
  }

  createShader (rect: Rect, textDirection: TextDirection | null): AtShader {
    return AtGradient.linear(
      this.begin.resolve(textDirection).withinRect(rect),
      this.end.resolve(textDirection).withinRect(rect),
      this.colors, 
      this.impliedStops(), 
      this.tileMode, 
      this.resolveTransform(rect, textDirection),
    )
  }

  scale (factor: number): AtLinearGradient {
    return new AtLinearGradient(
      this.begin,
      this.end,
      (this.colors as Array<Color>).map<Color>((color) => Color.lerp(null, color, factor) as Color),
      this.stops,
      this.tileMode,
      this.transform
    )
  }

  lerpFrom (a: AtGradient | null, t: number): AtGradient | null {
    if (a === null || (a instanceof AtLinearGradient)) {
      return AtLinearGradient.lerp(a as AtLinearGradient, this, t)
    }

    return super.lerpFrom(a, t)
  }

  lerpTo (b: AtGradient | null, t: number): AtGradient | null {
    if (b === null || (b instanceof AtLinearGradient)) {
      return AtLinearGradient.lerp(this, b as AtLinearGradient, t)
    }

    return super.lerpTo(b, t)
  }

  static lerp (
    a: AtLinearGradient | null, 
    b: AtLinearGradient | null, 
    t: number
  ): AtLinearGradient | null {
    invariant(t !== null)
    if (a === null && b === null) {
      return null
    }
    if (a === null) {
      return b!.scale(t)
    }
    if (b === null) {
      return a.scale(1.0 - t);
    }
    const interpolated: ColorsAndStops = interpolateColorsAndStops(
      a.colors,
      a.impliedStops(),
      b.colors,
      b.impliedStops(),
      t,
    )
    
    return new AtLinearGradient(
      AtAlignmentGeometry.lerp(a.begin, b.begin, t)!,
      AtAlignmentGeometry.lerp(a.end, b.end, t)!,
      interpolated.colors,
      interpolated.stops,
      t < 0.5 ? a.tileMode : b.tileMode, // TODO(ianh): interpolate tile mode
      null
    )
  }

  equal (other: AtLinearGradient | null) {    
    return (
      other instanceof AtLinearGradient &&
      other.begin === this.begin &&
      other.end === this.end &&
      other.tileMode === this.tileMode &&
      other.transform === this.transform &&
      listEquals<Color>(other.colors as Array<Color>, this.colors as Array<Color>) &&
      listEquals<number>(other.stops, this.stops) 
    )
  }

  notEqual (other: AtLinearGradient | null) {
    return !this.equal(other)
  }

  toString () {
    return ``
  }
}


export class AtRadialGradient extends AtGradient {
  static lerp (
    a: AtRadialGradient | null, 
    b: AtRadialGradient | null, 
    t: number
  ): AtRadialGradient | null {
    invariant(t !== null);
    if (a === null && b === null) {
      return null
    }
    if (a === null) {
      return b!.scale(t)
    }
    if (b === null) {
      return a.scale(1.0 - t)
    }
    const interpolated = interpolateColorsAndStops(
      a.colors,
      a.impliedStops(),
      b.colors,
      b.impliedStops(),
      t,
    )

    return new AtRadialGradient(
      AtAlignmentGeometry.lerp(a.center, b.center, t)!,
      Math.max(0.0, lerp(a.radius, b.radius, t)!),
      interpolated.colors,
      interpolated.stops,
      t < 0.5 ? a.tileMode : b.tileMode,
      AtAlignmentGeometry.lerp(a.focal, b.focal, t) as AtAlignmentGeometry,
      Math.max(0.0, lerp(a.focalRadius, b.focalRadius, t)!),
      null
    )
  }

  public center: AtAlignmentGeometry
  public radius: number
  public tileMode: TileMode
  public focal: AtAlignmentGeometry
  public focalRadius: number

  constructor (
    center: AtAlignmentGeometry = AtAlignment.center,
    radius: number = 0.5,
    colors: ArrayLike<Color>,
    stops: ArrayLike<number> | null,
    tileMode: TileMode = At.TileMode.Clamp,
    focal: AtAlignmentGeometry,
    focalRadius: number = 0.0,
    transform: AtGradientTransform | null
  ) {
    invariant(center !== null, `The argument center cannot be null.`)
    invariant(radius !== null, `The argument radius cannot be null.`)
    invariant(tileMode !== null, `The argument tileMode cannot be null.`)
    invariant(focalRadius !== null, `The argument focalRadius cannot be null.`)
    
    super(colors, stops, transform)

    this.center = center
    this.radius = radius
    this.tileMode = tileMode
    this.focal = focal
    this.focalRadius = focalRadius
  }

  createShader (rect: Rect, textDirection: TextDirection) {
    return AtGradient.radial(
      this.center.resolve(textDirection).withinRect(rect),
      this.radius * rect.shortestSide,
      this.colors, 
      this.impliedStops(), 
      this.tileMode,
      this.resolveTransform(rect, textDirection),
      this.focal === null  ? null : this.focal!.resolve(textDirection).withinRect(rect),
      this.focalRadius * rect.shortestSide,
    )
  }
  
  scale (factor: number): AtRadialGradient {
    return new AtRadialGradient(
      this.center,
      this.radius,
      (this.colors as Array<Color>).map<Color>((color) => Color.lerp(null, color, factor)!),
      this.stops,
      this.tileMode,
      this.focal,
      this.focalRadius,
      null
    )
  }

  lerpFrom (a: AtGradient | null, t: number): AtGradient | null {
    if (a === null || (a instanceof AtRadialGradient)) {
      return AtRadialGradient.lerp(a as AtRadialGradient, this, t);
    }
    return super.lerpFrom(a, t);
  }

  /**
   * 
   * @param b 
   * @param t 
   * @returns 
   */
  lerpTo (b: AtGradient | null, t: number): AtGradient | null {
    if (b === null || (b instanceof AtRadialGradient)) {
      return AtRadialGradient.lerp(this, b as AtRadialGradient, t);
    }

    return super.lerpTo(b, t);
  }

  equal (other: AtRadialGradient | null) {
    return (
      other instanceof AtRadialGradient &&
      other.radius === this.radius &&
      other.tileMode === this.tileMode &&
      other.transform === this.transform &&
      other.focalRadius === this.focalRadius &&
      other.center.equal(this.center) &&
      other.focal.equal(this.focal) &&
      listEquals<Color>(other.colors as Array<Color>, this.colors as Array<Color>) &&
      listEquals<number>(other.stops, this.stops) 
    )
  }

  notEqual (other: AtRadialGradient | null) {
    return !this.equal(other)
  }

  toString () {
    return `AtRadialGradient()`
  }
}

export class AtSweepGradient extends AtGradient {
  static lerp (
    a: AtSweepGradient | null, 
    b: AtSweepGradient | null, 
    t: number
  ): AtSweepGradient | null {
    invariant(t !== null)
    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return b!.scale(t)
    }

    if (b === null) {
      return a.scale(1.0 - t)
    }

    const interpolated = interpolateColorsAndStops(
      a.colors,
      a.impliedStops(),
      b.colors,
      b.impliedStops(),
      t,
    )

    return new AtSweepGradient(
      AtAlignmentGeometry.lerp(a.center, b.center, t)!,
      Math.max(0.0, lerp(a.startAngle, b.startAngle, t)!),
      Math.max(0.0, lerp(a.endAngle, b.endAngle, t)!),
      interpolated.colors,
      interpolated.stops,
      t < 0.5 ? a.tileMode : b.tileMode,
      null
    )
  }

  public center: AtAlignmentGeometry
  public startAngle: number
  public endAngle: number
  public tileMode: TileMode

  constructor (
    center: AtAlignmentGeometry = AtAlignment.center,
    startAngle: number = 0.0,
    endAngle: number = Math.PI * 2,
    colors: ArrayLike<Color>,
    stops: ArrayLike<number> | null,
    tileMode: TileMode,
    transform: AtGradientTransform | null
  ) {
   
    
    super(colors, stops, transform)

    this.center = center
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.tileMode = tileMode
  }

  createShader (
    rect: Rect, 
    textDirection: TextDirection
  ): AtShader {
    return AtGradient.sweep(
      this.center.resolve(textDirection).withinRect(rect),
      this.colors as Array<Color>, 
      this.impliedStops(), 
      this.tileMode,
      this.startAngle,
      this.endAngle,
      this.resolveTransform(rect, textDirection),
    )
  }

  scale (factor: number): AtSweepGradient {
    return new AtSweepGradient(
      this.center,
      this.startAngle,
      this.endAngle,
      (this.colors as Array<Color>).map<Color>((color) => Color.lerp(null, color, factor)!),
      this.stops,
      this.tileMode,
      null
    )
  }

  lerpFrom (a: AtGradient | null, t: number): AtGradient | null {
    if (a === null || (a instanceof AtSweepGradient)) {
      return AtSweepGradient.lerp(a as AtSweepGradient, this, t)
    }
    
    return super.lerpFrom(a, t)
  }

  lerpTo (b: AtGradient | null, t: number): AtGradient | null {
    if (b === null || (b instanceof AtSweepGradient)) {
      return AtSweepGradient.lerp(this, b as AtSweepGradient, t)
    }

    return super.lerpTo(b, t)
  }

  equal (other: AtSweepGradient | null) {
    return (
      other instanceof AtSweepGradient &&
      other.center === this.center &&
      other.startAngle === this.startAngle &&
      other.endAngle === this.endAngle &&
      other.tileMode === this.tileMode &&
      other.transform === this.transform &&
      listEquals<Color>(other.colors as Array<Color>, this.colors as Array<Color>) &&
      listEquals<number>(other.stops, this.stops)
    )
  }

  notEqual (other: AtSweepGradient | null) {
    return !this.equal(other)
  }

  toString () {
    return `AtSweepGradient()`
  }
}
