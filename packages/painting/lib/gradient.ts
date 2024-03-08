import { invariant, lerp, listEquals } from '@at/utils'
import { Color, Equalable } from '@at/basic'
import { Matrix4 } from '@at/math'
import { Engine, GradientConical, GradientLinear, GradientRadial, GradientSweep, Shader, Skia } from '@at/engine'
import { Offset, Rect } from '@at/geometry'
import { Alignment, AlignmentGeometry } from './alignment'




export interface ColorsAndStops {
  colors: Color[]
  stops: number[]
}

/**
 * 
 * @param {Color[]} colors 
 * @param {number[]} stops 
 * @param {number} t 
 * @returns 
 */
function sample (
  colors: Color[], 
  stops: number[], 
  t: number
): Color {
  invariant(colors.length !== 0, `The argument "colors" length cannot be zero.`)
  invariant(stops.length !== 0, `The argument "stops" length cannot be zero.`)
  
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
 * @param {Color} aColors
 * @param {number} aStops
 * @param {Color} bColors
 * @param {number} bStops
 * @param {number} t
 * @return {*}
 */
function interpolateColorsAndStops (
  aColors: Color[],
  aStops: number[],
  bColors: Color[],
  bStops: number[],
  t: number,
): ColorsAndStops {
  invariant(aColors.length >= 2)
  invariant(bColors.length >= 2)
  invariant(aStops.length === aColors.length)
  invariant(bStops.length === bColors.length)

  const stops = new Set<number>([...(aStops as Array<number>), ...bStops])
  const interpolatedStops: number[] = Array.from(stops).sort()
  
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

//// => GradientTransform
export abstract class GradientTransform implements Equalable<GradientTransform> {
  abstract transform (
    bounds: Rect, 
    textDirection?: Skia.TextDirection | null
  ): Matrix4 | null

    abstract equal (other: GradientTransform | null): boolean
    abstract notEqual (other: GradientTransform | null): boolean
}

//// => GradientRotation
export class GradientRotation extends GradientTransform {
  public radians: number

  constructor (radians: number) {
    super()
    this.radians = radians
  }

  transform (
    bounds: Rect, 
    textDirection?: Skia.TextDirection | null
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

  equal (other: GradientRotation | null) {
    return (
      other instanceof GradientRotation && 
      other.radians === this.radians
    )
  }

  notEqual(other: GradientRotation | null): boolean {
    return !this.equal(other)
  }

  toString () {
    return `GradientRotation([radians]: ${this.radians})`
  }
}

/**
 * @description: 渐变抽象类
 */
export abstract class Gradient {

  static linear (
    from: Offset,
    to: Offset ,
    colors: Color[], 
    stops: number[] = [],
    tileMode: Skia.TileMode = Engine.skia.TileMode.Clamp,
    matrix4: number[] | null = null,
  ) {
    return GradientLinear.create({
      from, 
      to, 
      colors, 
      stops, 
      tileMode, 
      matrix4
    })
  }

  static radial (
    center: Offset,
    radius: number,
    colors: Color[], 
    stops: number[],
    tileMode: Skia.TileMode = Engine.skia.TileMode.Clamp,
    matrix4: number[] | null = null,
    focal: Offset | null = null,
    focalRadius: number = 0,
  ) {
    if (focal === null || (focal === center && focalRadius === 0)) {
      return GradientRadial.create({
        center, 
        radius, 
        tileMode, 
        colors, 
        stops, 
        matrix4
      })
    } else {
      invariant(center.notEqual(Offset.ZERO) || focal.notEqual(Offset.ZERO), ``)
      
      return new GradientConical(
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
    stops: number[],
    tileMode: Skia.TileMode = Engine.skia.TileMode.Clamp,
    startAngle: number = 0.0,
    endAngle: number = Math.PI * 2,
    matrix4: number[] | null = null,
  ) {
    return new GradientSweep(
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
  static lerp (a: Gradient | null, b: Gradient | null, t: number): Gradient | null {
    let result: Gradient | null = null

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

  public colors: Color[]
  public stops: number[] | null
  public transform: GradientTransform | null
  
  constructor (
    colors: Color[],
    stops: number[] | null,
    transform: GradientTransform | null
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
    rect: Rect, 
    textDirection: Skia.TextDirection | null
  ): Shader
  
  abstract scale (factor: number): Gradient
  
  lerpFrom (a: Gradient | null, t: number): Gradient | null {
    if (a === null) {
      return this.scale(t)
    }
    return null
  }

  lerpTo (
    b: Gradient | null, 
    t: number
  ): Gradient | null {
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
    textDirection?: Skia.TextDirection | null
  ) {
    return this.transform?.transform(
      bounds, 
      textDirection
    ) ?? null
  }

  abstract equal (gradient: Gradient | null): boolean
  abstract notEqual (gradient: Gradient | null): boolean 
}

//// => LinearGradient
export type LinearGradientOptions = {
  begin?: AlignmentGeometry,
  end?: AlignmentGeometry,
  colors: Color[],
  stops: number[] | null,
  tileMode: Skia.TileMode,
  transform?: GradientTransform | null
}

export class LinearGradient extends Gradient {
  static create (options: LinearGradientOptions) {
    return new LinearGradient(
      options.begin,
      options.end,
      options.colors,
      options.stops,
      options.tileMode,
      options.transform
    )
  } 

  public begin: AlignmentGeometry
  public end: AlignmentGeometry
  public tileMode: Skia.TileMode

  constructor (
    begin: AlignmentGeometry = Alignment.CENTER_LEFT,
    end: AlignmentGeometry = Alignment.CENTER_RIGHT,
    colors: Color[],
    stops: number[] | null,
    tileMode: Skia.TileMode,
    transform: GradientTransform | null = null
  ) {
    super(
      colors,
      stops,
      transform
    )

    this.begin = begin
    this.end = end
    this.tileMode = tileMode
  }

  createShader (rect: Rect, textDirection: Skia.TextDirection | null): Shader {
    return Gradient.linear(
      this.begin.resolve(textDirection).withinRect(rect),
      this.end.resolve(textDirection).withinRect(rect),
      this.colors, 
      this.impliedStops(), 
      this.tileMode, 
      this.resolveTransform(rect, textDirection),
    )
  }

  scale (factor: number): LinearGradient {
    return new LinearGradient(
      this.begin,
      this.end,
      this.colors.map<Color>((color) => Color.lerp(null, color, factor) as Color),
      this.stops,
      this.tileMode,
      this.transform
    )
  }

  lerpFrom (a: Gradient | null, t: number): Gradient | null {
    if (a === null || (a instanceof LinearGradient)) {
      return LinearGradient.lerp(a as LinearGradient, this, t)
    }

    return super.lerpFrom(a, t)
  }

  lerpTo (b: Gradient | null, t: number): Gradient | null {
    if (b === null || (b instanceof LinearGradient)) {
      return LinearGradient.lerp(this, b as LinearGradient, t)
    }

    return super.lerpTo(b, t)
  }

  static lerp (
    a: LinearGradient | null, 
    b: LinearGradient | null, 
    t: number
  ): LinearGradient | null {
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
    
    return new LinearGradient(
      AlignmentGeometry.lerp(a.begin, b.begin, t)!,
      AlignmentGeometry.lerp(a.end, b.end, t)!,
      interpolated.colors,
      interpolated.stops,
      t < 0.5 ? a.tileMode : b.tileMode, // TODO(ianh): interpolate tile mode
      null
    )
  }

  equal (other: LinearGradient | null) {    
    return (
      other instanceof LinearGradient &&
      other.begin === this.begin &&
      other.end === this.end &&
      other.tileMode === this.tileMode &&
      other.transform === this.transform &&
      listEquals<Color>(other.colors as Array<Color>, this.colors as Array<Color>) &&
      listEquals<number>(other.stops, this.stops) 
    )
  }

  notEqual (other: LinearGradient | null) {
    return !this.equal(other)
  }

  toString () {
    return `LinearGradient(
      [begin]: ${this.begin}
      [end]: ${this.end}
      [colors]: ${this.colors}
      [stops]: ${this.stops}
      [tileMode]: ${this.tileMode}
      [transform]: ${this.transform}
    )`
  }
}


export class RadialGradient extends Gradient {
  static lerp (
    a: RadialGradient | null, 
    b: RadialGradient | null, 
    t: number
  ): RadialGradient | null {
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

    return new RadialGradient(
      AlignmentGeometry.lerp(a.center, b.center, t) as AlignmentGeometry,
      Math.max(0.0, lerp(a.radius, b.radius, t)),
      interpolated.colors,
      interpolated.stops,
      t < 0.5 ? a.tileMode : b.tileMode,
      AlignmentGeometry.lerp(a.focal, b.focal, t) as AlignmentGeometry,
      Math.max(0.0, lerp(a.focalRadius, b.focalRadius, t)),
      null
    )
  }

  public center: AlignmentGeometry
  public radius: number
  public tileMode: Skia.TileMode
  public focal: AlignmentGeometry
  public focalRadius: number

  constructor (
    center: AlignmentGeometry = Alignment.CENTER,
    radius: number = 0.5,
    colors: Color[],
    stops: number[] | null,
    tileMode: Skia.TileMode,
    focal: AlignmentGeometry,
    focalRadius: number = 0.0,
    transform: GradientTransform | null
  ) {
    super(colors, stops, transform)

    this.center = center
    this.radius = radius
    this.tileMode = tileMode ?? Engine.skia.TileMode.Clamp
    this.focal = focal
    this.focalRadius = focalRadius
  }

  createShader (rect: Rect, textDirection: Skia.TextDirection) {
    return Gradient.radial(
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
  
  scale (factor: number): RadialGradient {
    return new RadialGradient(
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

  lerpFrom (a: Gradient | null, t: number): Gradient | null {
    if (a === null || (a instanceof RadialGradient)) {
      return RadialGradient.lerp(a as RadialGradient, this, t);
    }
    return super.lerpFrom(a, t);
  }

  /**
   * 
   * @param b 
   * @param t 
   * @returns 
   */
  lerpTo (b: Gradient | null, t: number): Gradient | null {
    if (b === null || (b instanceof RadialGradient)) {
      return RadialGradient.lerp(this, b as RadialGradient, t);
    }

    return super.lerpTo(b, t);
  }

  equal (other: RadialGradient | null) {
    return (
      other instanceof RadialGradient &&
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

  notEqual (other: RadialGradient | null) {
    return !this.equal(other)
  }

  toString () {
    return `RadialGradient()`
  }
}

export class AtSweepGradient extends Gradient {
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
      AlignmentGeometry.lerp(a.center, b.center, t)!,
      Math.max(0.0, lerp(a.startAngle, b.startAngle, t)!),
      Math.max(0.0, lerp(a.endAngle, b.endAngle, t)!),
      interpolated.colors,
      interpolated.stops,
      t < 0.5 ? a.tileMode : b.tileMode,
      null
    )
  }

  public center: AlignmentGeometry
  public startAngle: number
  public endAngle: number
  public tileMode: Skia.TileMode

  constructor (
    center: AlignmentGeometry = Alignment.CENTER,
    startAngle: number = 0.0,
    endAngle: number = Math.PI * 2,
    colors: Color[],
    stops: number[] | null,
    tileMode: Skia.TileMode,
    transform: GradientTransform | null
  ) {
   
    
    super(colors, stops, transform)

    this.center = center
    this.startAngle = startAngle
    this.endAngle = endAngle
    this.tileMode = tileMode
  }

  createShader (
    rect: Rect, 
    textDirection: Skia.TextDirection
  ): Shader {
    return Gradient.sweep(
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

  lerpFrom (a: Gradient | null, t: number): Gradient | null {
    if (a === null || (a instanceof AtSweepGradient)) {
      return AtSweepGradient.lerp(a as AtSweepGradient, this, t)
    }
    
    return super.lerpFrom(a, t)
  }

  lerpTo (b: Gradient | null, t: number): Gradient | null {
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
    return `SweepGradient()`
  }
}
