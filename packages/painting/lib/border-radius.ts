import { invariant } from '@at/utils'
import { Engine, Skia } from '@at/engine'
import { Radius, Rect, RRect } from '@at/geometry'
import { Equalable } from 'packages/basic/types/lib'



//// => BorderRadiusGeometry
export abstract class BorderRadiusGeometry implements Equalable<BorderRadiusGeometry> {
  /**
   * 
   * @param {BorderRadiusGeometry | null} a 
   * @param {BorderRadiusGeometry | null} b 
   * @param {number} t 
   * @returns {BorderRadiusGeometry | null}
   */
  static lerp (
    a: BorderRadiusGeometry | null, 
    b: BorderRadiusGeometry | null, 
    t: number
  ): BorderRadiusGeometry | null {
    if (a === null && b === null) {
      return null
    }

    a ??= BorderRadius.ZERO
    b ??= BorderRadius.ZERO

    return a.add(b.subtract(a).multiply(t))
  }

  public topLeft: Radius
  public topRight: Radius
  public bottomLeft: Radius
  public bottomRight: Radius
  public topStart: Radius
  public topEnd: Radius
  public bottomStart: Radius
  public bottomEnd: Radius


  constructor (...rests: Radius[])
  /**
   * 
   * @param {Radius} topLeft 
   * @param {Radius} topRight 
   * @param {Radius} bottomRight 
   * @param {Radius} bottomLeft 
   * @param {Radius} topStart 
   * @param {Radius} topEnd 
   * @param {Radius} bottomStart 
   * @param {Radius} bottomEnd 
   */
  constructor (
    topLeft: Radius,
    topRight: Radius,
    bottomRight: Radius,
    bottomLeft: Radius,
    topStart: Radius,
    topEnd: Radius,
    bottomStart: Radius,
    bottomEnd: Radius,
  ) {
    this.topLeft = topLeft
    this.topRight = topRight
    this.bottomRight = bottomRight
    this.bottomLeft = bottomLeft
    this.topStart = topStart
    this.topEnd = topEnd
    this.bottomStart = bottomStart
    this.bottomEnd = bottomEnd
  }

  /**
   * 圆角相加
   * @param {BorderRadiusGeometry} other 
   * @returns {BorderRadiusGeometry}
   */
  add (other: BorderRadiusGeometry): BorderRadiusGeometry {
    return new MixedBorderRadius(
      this.topLeft.add(other.topLeft),
      this.topRight.add(other.topRight),
      this.bottomLeft.add(other.bottomLeft),
      this.bottomRight.add(other.bottomRight),
      this.topStart.add(other.topStart),
      this.topEnd.add(other.topEnd),
      this.bottomStart.add(other.bottomStart),
      this.bottomEnd.add(other.bottomEnd),
    )
  }

  /**
   * 
   * @param {BorderRadiusGeometry} other 
   * @returns {BorderRadiusGeometry}
   */
  subtract (other: BorderRadiusGeometry): BorderRadiusGeometry {
    return new MixedBorderRadius(
      this.topLeft.subtract(other.topLeft),
      this.topRight.subtract(other.topRight),
      this.bottomLeft.subtract(other.bottomLeft),
      this.bottomRight.subtract(other.bottomRight),
      this.topStart.subtract(other.topStart),
      this.topEnd.subtract(other.topEnd),
      this.bottomStart.subtract(other.bottomStart),
      this.bottomEnd.subtract(other.bottomEnd),
    )
  }

  abstract inverse (): BorderRadiusGeometry
  abstract multiply (other: number): BorderRadiusGeometry
  abstract divide (other: number): BorderRadiusGeometry
  abstract modulo (other: number): BorderRadiusGeometry
  abstract resolve (direction: Skia.TextDirection | null): BorderRadius

  equal (other: BorderRadiusGeometry | null) {
    return (
      other instanceof BorderRadiusGeometry &&
      other.topLeft.equal(this.topLeft) &&
      other.topRight.equal(this.topRight) &&
      other.bottomLeft.equal(this.bottomLeft) &&
      other.bottomRight.equal(this.bottomRight) &&
      other.topStart.equal(this.topStart) &&
      other.topEnd.equal(this.topEnd) &&
      other.bottomStart.equal(this.bottomStart) &&
      other.bottomEnd.equal(this.bottomEnd)
    )
  }

  notEqual (other: BorderRadiusGeometry | null) {
    return !this.equal(other)
  }

  toString () {
    return `BorderRadiusGeometry(
      [topLeft]: ${this.topLeft},
      [topRight]: ${this.topRight},
      [bottomLeft]: ${this.bottomLeft},
      [bottomRight]: ${this.bottomRight},
      [topStart]: ${this.topStart},
      [topEnd]: ${this.topEnd},
      [bottomStart]: ${this.bottomStart},
      [bottomEnd]: ${this.bottomEnd},
    )`
  }
}

export class BorderRadius extends BorderRadiusGeometry {
  static ZERO = BorderRadius.all(Radius.ZERO)

  static all (radius: Radius) {
    return this.only(
      radius,
      radius,
      radius,
      radius,
    )
  }

  static lerp (
    a: BorderRadius | null, 
    b: BorderRadius | null, 
    t: number
  ): BorderRadius | null {
    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      invariant(b)
      return b.multiply(t)
    }

    if (b == null) {
      return a.multiply(1.0 - t)
    }

    return BorderRadius.only(
      Radius.lerp(a.topLeft, b.topLeft, t) as Radius,
      Radius.lerp(a.topRight, b.topRight, t) as Radius,
      Radius.lerp(a.bottomRight, b.bottomRight, t) as Radius,
      Radius.lerp(a.bottomLeft, b.bottomLeft, t) as Radius,
    )
  }

  static circular (radius: number) {
    return BorderRadius.all(Radius.circular(radius))
  }

  static vertical (top: Radius = Radius.ZERO, bottom: Radius = Radius.ZERO,) {
    return BorderRadius.only(top, top, bottom, bottom)
  }

  static horizontal(left: Radius = Radius.ZERO, right: Radius = Radius.ZERO,) {
    BorderRadius.only(left, right, right, left)
  } 

  static only(
    topLeft: Radius = Radius.ZERO,
    topRight: Radius = Radius.ZERO,
    bottomRight: Radius = Radius.ZERO,
    bottomLeft: Radius = Radius.ZERO,
  ) {
    return new BorderRadius(
      topLeft, 
      topRight, 
      bottomRight, 
      bottomLeft
    )
  }

  constructor (
    topLeft: Radius,
    topRight: Radius,
    bottomRight: Radius,
    bottomLeft: Radius,
  ) {
    super(
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
      Radius.ZERO,
      Radius.ZERO,
      Radius.ZERO,
      Radius.ZERO,
    )
  }

  /**
   * 复制 BorderRadius 对象
   * @param {Radius} topLeft
   * @param {Radius} topRight
   * @param {Radius} bottomRight
   * @param {Radius} bottomLeft
   * @return {*}
   */
  copyWith (
   topLeft:  Radius | null,
   topRight:  Radius | null,
   bottomRight:  Radius | null,
   bottomLeft:  Radius | null,
  ) {
    return BorderRadius.only(
      topLeft ?? this.topLeft,
      topRight ?? this.topRight,
      bottomRight ?? this.bottomRight,
      bottomLeft ?? this.bottomLeft,
    )
  }

  /**
   * 
   * @param rect 
   * @returns 
   */
  toRRect (rect: Rect ): RRect {
    return RRect.fromRectAndCorners(
      rect,
      this.topLeft,
      this.topRight,
      this.bottomRight,
      this.bottomLeft,
    )
  }

  inverse (): BorderRadius {
    return BorderRadius.only(
      this.topLeft.inverse(),
      this.topRight.inverse(),
      this.bottomRight.inverse(),
      this.bottomLeft.inverse(),
    )
  }

  subtract (other: BorderRadiusGeometry): BorderRadiusGeometry {
    return BorderRadius.only(
      this.topLeft.subtract(other.topLeft),
      this.topRight.subtract(other.topRight),
      this.bottomRight.subtract(other.bottomRight),
      this.bottomLeft.subtract(other.bottomLeft),
    )
  }

  add (other: BorderRadiusGeometry): BorderRadiusGeometry {
    return BorderRadius.only(
      this.topLeft.add(other.topLeft),
      this.topRight.add(other.topRight),
      this.bottomRight.add(other.bottomRight),
      this.bottomLeft.add(other.bottomLeft),
    )
  }

  multiply (other: number): BorderRadius {
    return BorderRadius.only(
      this.topLeft.multiply(other),
      this.topRight.multiply(other),
      this.bottomRight.multiply(other),
      this.bottomLeft.multiply(other),
    )
  }

  divide (other: number): BorderRadius {
    return BorderRadius.only(
      this.topLeft.divide(other),
      this.topRight.divide(other),
      this.bottomRight.divide(other),
      this.bottomLeft.divide(other),
    )
  }

  modulo (other: number): BorderRadius {
    return BorderRadius.only(
      this.topLeft.modulo(other),
      this.topRight.modulo(other),
      this.bottomRight.modulo(other),
      this.bottomLeft.modulo(other),
    )
  }
  
  resolve (direction: Skia.TextDirection | null) {
    return this
  }
}

export class BorderRadiusDirectional extends BorderRadiusGeometry {
  static zero = BorderRadiusDirectional.all(Radius.ZERO)

  /**
   * 插值计算
   * @param {BorderRadiusDirectional} a 
   * @param {BorderRadiusDirectional} b 
   * @param {number} t 
   * @returns {BorderRadiusDirectional | null}
   */
  static lerp (
    a: BorderRadiusDirectional | null, 
    b: BorderRadiusDirectional | null, 
    t: number
  ): BorderRadiusDirectional | null {    
    if (a === null && b === null) {
      return null
    }
    if (a === null) {
      invariant(b)
      return b.multiply(t)
    }

    if (b === null) {
      return a.multiply(1.0 - t)
    }

    return BorderRadiusDirectional.only(
      Radius.lerp(a.topStart, b.topStart, t) as Radius,
      Radius.lerp(a.topEnd, b.topEnd, t) as Radius,
      Radius.lerp(a.bottomStart, b.bottomStart, t) as Radius,
      Radius.lerp(a.bottomEnd, b.bottomEnd, t) as Radius,
    )
  }

  static all (radius: Radius) {
    return BorderRadiusDirectional.only(radius, radius, radius, radius)
  }

  static circular (radius: number) {
    return this.all(Radius.circular(radius))
  }

  /**
   * 
   * @param {Radius} top 
   * @param {Radius} bottom 
   * @returns {BorderRadiusDirectional}
   */
  static vertical (
    top: Radius = Radius.ZERO, 
    bottom: Radius = Radius.ZERO
  ) {
    return BorderRadiusDirectional.only(top, top, bottom, bottom)
  }

  /**
   * 
   * @param start 
   * @param end 
   * @returns 
   */
  static horizontal (
    start: Radius = Radius.ZERO, 
    end: Radius = Radius.ZERO
  ) {
    return BorderRadiusDirectional.only(
      start,
      end,
      start,
      end,
    )
  }

  static only(
    topStart: Radius = Radius.ZERO,
    topEnd: Radius = Radius.ZERO,
    bottomStart: Radius = Radius.ZERO,
    bottomEnd: Radius = Radius.ZERO,
  ) {
    return new BorderRadiusDirectional(
      topStart,
      topEnd,
      bottomStart,
      bottomEnd,
    )
  }

  /**
   * 构造函数
   * @param {Radius} topStart 
   * @param {Radius} topEnd 
   * @param {Radius} bottomStart 
   * @param {Radius} bottomEnd 
   */
  constructor (
    topStart: Radius,
    topEnd: Radius,
    bottomStart: Radius,
    bottomEnd: Radius,
  ) { 
    super(
      Radius.ZERO,
      Radius.ZERO,
      Radius.ZERO,
      Radius.ZERO,
      topStart,
      topEnd,
      bottomStart,
      bottomEnd,
    )
  }

  inverse (): BorderRadiusGeometry {
    return BorderRadiusDirectional.only(
      this.topStart.inverse(),
      this.topEnd.inverse(),
      this.bottomStart.inverse(),
      this.bottomEnd.inverse(),
    )
  }

  subtract (other: BorderRadiusGeometry): BorderRadiusGeometry  {
    return BorderRadiusDirectional.only(
      this.topStart.subtract(other.topStart),
      this.topEnd.subtract(other.topEnd),
      this.bottomStart.subtract(other.bottomStart),
      this.bottomEnd.subtract(other.bottomEnd),
    )
  }

  multiply (other: number): BorderRadiusGeometry  {
    return BorderRadiusDirectional.only(
      this.topStart.multiply(other),
      this.topEnd.multiply(other),
      this.bottomStart.multiply(other),
      this.bottomEnd.multiply(other),
    )
  }

  divide (other: number): BorderRadiusGeometry  {
    return BorderRadiusDirectional.only(
      this.topStart.divide(other),
      this.topEnd.divide(other),
      this.bottomStart.divide(other),
      this.bottomEnd.divide(other),
    )
  }

  modulo (other: number): BorderRadiusGeometry  {
    return BorderRadiusDirectional.only(
      this.topStart.modulo(other),
      this.topEnd.modulo(other),
      this.bottomStart.modulo(other),
      this.bottomEnd.modulo(other),
    )
  }
  
  resolve (direction: Skia.TextDirection | null): BorderRadius {
    invariant(direction !== null)

    if (direction === Engine.skia.TextDirection.RTL) {
      return BorderRadius.only(
        this.topEnd,
        this.topStart,
        this.bottomEnd,
        this.bottomStart,
      )
    } else {
      return BorderRadius.only(
        this.topStart,
        this.topEnd,
        this.bottomStart,
        this.bottomEnd,
      )
    }
  }
}

export class MixedBorderRadius extends BorderRadiusGeometry {
  constructor (
    topLeft: Radius,
    topRight: Radius,
    bottomLeft: Radius,
    bottomRight: Radius,
    topStart: Radius,
    topEnd: Radius,
    bottomStart: Radius,
    bottomEnd: Radius,
  ) {
    super(
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
      topStart,
      topEnd,
      bottomStart,
      bottomEnd,
    )
  }

  inverse (): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.inverse(),
      this.topRight.inverse(),
      this.bottomLeft.inverse(),
      this.bottomRight.inverse(),
      this.topStart.inverse(),
      this.topEnd.inverse(),
      this.bottomStart.inverse(),
      this.bottomEnd.inverse(),
    )
  }

  add (other: MixedBorderRadius): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.add(other.topLeft),
      this.topRight.add(other.topRight),
      this.bottomLeft.add(other.bottomLeft),
      this.bottomRight.add(other.bottomRight),
      this.topStart.add(other.topStart),
      this.topEnd.add(other.topEnd),
      this.bottomStart.add(other.bottomStart),
      this.bottomEnd.add(other.bottomEnd),
    )
  }

  subtract (other: MixedBorderRadius): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.subtract(other.topLeft),
      this.topRight.subtract(other.topRight),
      this.bottomLeft.subtract(other.bottomLeft),
      this.bottomRight.subtract(other.bottomRight),
      this.topStart.subtract(other.topStart),
      this.topEnd.subtract(other.topEnd),
      this.bottomStart.subtract(other.bottomStart),
      this.bottomEnd.subtract(other.bottomEnd),
    )
  }

  multiply (other: number): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.multiply(other),
      this.topRight.multiply(other),
      this.bottomLeft.multiply(other),
      this.bottomRight.multiply(other),
      this.topStart.multiply(other),
      this.topEnd.multiply(other),
      this.bottomStart.multiply(other),
      this.bottomEnd.multiply(other),
    )
  }

  divide (other: number): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.divide(other),
      this.topRight.divide(other),
      this.bottomLeft.divide(other),
      this.bottomRight.divide(other),
      this.topStart.divide(other),
      this.topEnd.divide(other),
      this.bottomStart.divide(other),
      this.bottomEnd.divide(other),
    )
  }

  modulo (other: number): MixedBorderRadius {
    return new MixedBorderRadius(
      this.topLeft.modulo(other),
      this.topRight.modulo(other),
      this.bottomLeft.modulo(other),
      this.bottomRight.modulo(other),
      this.topStart.modulo(other),
      this.topEnd.modulo(other),
      this.bottomStart.modulo(other),
      this.bottomEnd.modulo(other),
    )
  }
  
  resolve (direction: Skia.TextDirection | null): BorderRadius {
    invariant(direction !== null)

    if (direction === Engine.skia.TextDirection.RTL) {
      return BorderRadius.only(
        this.topLeft.add(this.topEnd),
        this.topRight.add(this.topStart),
        this.bottomLeft.add(this.bottomEnd),
        this.bottomRight.add(this.bottomStart),
      )
    } else {
      return BorderRadius.only(
        this.topLeft.add(this.topStart),
        this.topRight.add(this.topEnd),
        this.bottomLeft.add(this.bottomStart),
        this.bottomRight.add(this.bottomEnd),
      )
    }
  }
}
