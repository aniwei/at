import { invariant } from '@at/utility'
import { TextDirection } from '../engine/skia'
import { Radius, Rect, RRect } from '../basic/geometry'
import { At } from '../at'

export abstract class AtBorderRadiusGeometry {
  /**
   * 
   * @param {AtBorderRadiusGeometry | null} a 
   * @param {AtBorderRadiusGeometry | null} b 
   * @param {number} t 
   * @returns {AtBorderRadiusGeometry | null}
   */
  static lerp (
    a: AtBorderRadiusGeometry | null, 
    b: AtBorderRadiusGeometry | null, 
    t: number
  ): AtBorderRadiusGeometry | null {
    invariant(t !== null, `The argument "t" cannot be null.`)

    if (a === null && b === null) {
      return null
    }

    a ??= AtBorderRadius.zero
    b ??= AtBorderRadius.zero

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
   * @param {AtBorderRadiusGeometry} other 
   * @returns {AtBorderRadiusGeometry}
   */
  add (other: AtBorderRadiusGeometry): AtBorderRadiusGeometry {
    return new AtMixedBorderRadius(
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
   * @param {AtBorderRadiusGeometry} other 
   * @returns {AtBorderRadiusGeometry}
   */
  subtract (other: AtBorderRadiusGeometry): AtBorderRadiusGeometry {
    return new AtMixedBorderRadius(
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

  abstract negate (): AtBorderRadiusGeometry
  abstract multiply (other: number): AtBorderRadiusGeometry
  abstract divide (other: number): AtBorderRadiusGeometry
  abstract modulo (other: number): AtBorderRadiusGeometry
  abstract resolve (direction: TextDirection | null): AtBorderRadius

  equal (other: AtBorderRadiusGeometry | null) {
    return (
      other instanceof AtBorderRadiusGeometry &&
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

  notEqual (other: AtBorderRadiusGeometry | null) {
    return !this.equal(other)
  }

  toString () {
    return `AtBorderRadiusGeometry(...)`
  }
}

export class AtBorderRadius extends AtBorderRadiusGeometry {
  static zero = AtBorderRadius.all(Radius.zero)
  static all (radius: Radius) {
    return this.only(
      radius,
      radius,
      radius,
      radius,
    )
  }

  static lerp (
    a: AtBorderRadius | null, 
    b: AtBorderRadius | null, 
    t: number
  ): AtBorderRadius | null {
    invariant(t !== null)
    if (
      a === null && 
      b === null
    ) {
      return null
    }

    if (a === null) {
      return b!.multiply(t)
    }

    if (b == null) {
      return a.multiply(1.0 - t)
    }

    return AtBorderRadius.only(
      Radius.lerp(a.topLeft, b.topLeft, t)!,
      Radius.lerp(a.topRight, b.topRight, t)!,
      Radius.lerp(a.bottomRight, b.bottomRight, t)!,
      Radius.lerp(a.bottomLeft, b.bottomLeft, t)!,
    )
  }

  static circular (radius: number) {
    return AtBorderRadius.all(Radius.circular(radius))
  }

  static vertical (top: Radius = Radius.zero, bottom: Radius = Radius.zero,) {
    return AtBorderRadius.only(top, top, bottom, bottom)
  }

  static horizontal(left: Radius = Radius.zero, right: Radius = Radius.zero,) {
    AtBorderRadius.only(left, right, right, left)
  } 

  static only(
    topLeft: Radius = Radius.zero,
    topRight: Radius = Radius.zero,
    bottomRight: Radius = Radius.zero,
    bottomLeft: Radius = Radius.zero,
  ) {
    return new AtBorderRadius(topLeft, topRight, bottomRight, bottomLeft,)
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
      Radius.zero,
      Radius.zero,
      Radius.zero,
      Radius.zero,
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
    return AtBorderRadius.only(
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

  negate (): AtBorderRadius {
    return AtBorderRadius.only(
      this.topLeft.negate(),
      this.topRight.negate(),
      this.bottomRight.negate(),
      this.bottomLeft.negate(),
    )
  }

  subtract (other: AtBorderRadiusGeometry): AtBorderRadiusGeometry {
    return AtBorderRadius.only(
      this.topLeft.subtract(other.topLeft),
      this.topRight.subtract(other.topRight),
      this.bottomRight.subtract(other.bottomRight),
      this.bottomLeft.subtract(other.bottomLeft),
    )
  }

  add (other: AtBorderRadiusGeometry): AtBorderRadiusGeometry {
    return AtBorderRadius.only(
      this.topLeft.add(other.topLeft),
      this.topRight.add(other.topRight),
      this.bottomRight.add(other.bottomRight),
      this.bottomLeft.add(other.bottomLeft),
    )
  }

  multiply (other: number): AtBorderRadius {
    return AtBorderRadius.only(
      this.topLeft.multiply(other),
      this.topRight.multiply(other),
      this.bottomRight.multiply(other),
      this.bottomLeft.multiply(other),
    )
  }

  divide (other: number): AtBorderRadius {
    return AtBorderRadius.only(
      this.topLeft.divide(other),
      this.topRight.divide(other),
      this.bottomRight.divide(other),
      this.bottomLeft.divide(other),
    )
  }

  modulo (other: number): AtBorderRadius {
    return AtBorderRadius.only(
      this.topLeft.modulo(other),
      this.topRight.modulo(other),
      this.bottomRight.modulo(other),
      this.bottomLeft.modulo(other),
    )
  }
  
  resolve (direction: TextDirection | null) {
    return this
  }
}

export class AtBorderRadiusDirectional extends AtBorderRadiusGeometry {
  static zero = AtBorderRadiusDirectional.all(Radius.zero)

  /**
   * 插值计算
   * @param {AtBorderRadiusDirectional} a 
   * @param {AtBorderRadiusDirectional} b 
   * @param {number} t 
   * @returns {AtBorderRadiusDirectional | null}
   */
  static lerp (
    a: AtBorderRadiusDirectional | null, 
    b: AtBorderRadiusDirectional | null, 
    t: number
  ): AtBorderRadiusDirectional | null {
    invariant(t !== null, `The argument "t" cannot be null.`)
    
    if (a === null && b === null) {
      return null
    }
    if (a === null) {
      return b!.multiply(t)
    }

    if (b === null) {
      return a.multiply(1.0 - t)
    }

    return AtBorderRadiusDirectional.only(
      Radius.lerp(a.topStart, b.topStart, t) as Radius,
      Radius.lerp(a.topEnd, b.topEnd, t) as Radius,
      Radius.lerp(a.bottomStart, b.bottomStart, t) as Radius,
      Radius.lerp(a.bottomEnd, b.bottomEnd, t) as Radius,
    )
  }

  static all (radius: Radius) {
    return AtBorderRadiusDirectional.only(radius, radius, radius, radius)
  }

  static circular (radius: number) {
    return this.all(Radius.circular(radius))
  }

  /**
   * 
   * @param {Radius} top 
   * @param {Radius} bottom 
   * @returns {AtBorderRadiusDirectional}
   */
  static vertical(top: Radius = Radius.zero, bottom: Radius = Radius.zero,) {
    return AtBorderRadiusDirectional.only(top, top, bottom, bottom)
  }

  /**
   * 
   * @param start 
   * @param end 
   * @returns 
   */
  static horizontal(start: Radius = Radius.zero, end: Radius = Radius.zero) {
    return AtBorderRadiusDirectional.only(
      start,
      end,
      start,
      end,
    )
  }

  static only(
    topStart: Radius = Radius.zero,
    topEnd: Radius = Radius.zero,
    bottomStart: Radius = Radius.zero,
    bottomEnd: Radius = Radius.zero,
  ) {
    return new AtBorderRadiusDirectional(
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
      Radius.zero,
      Radius.zero,
      Radius.zero,
      Radius.zero,
      topStart,
      topEnd,
      bottomStart,
      bottomEnd,
    )
  }

  negate (): AtBorderRadiusGeometry {
    return AtBorderRadiusDirectional.only(
      this.topStart.negate(),
      this.topEnd.negate(),
      this.bottomStart.negate(),
      this.bottomEnd.negate(),
    )
  }

  subtract (other: AtBorderRadiusGeometry): AtBorderRadiusGeometry  {
    return AtBorderRadiusDirectional.only(
      this.topStart.subtract(other.topStart),
      this.topEnd.subtract(other.topEnd),
      this.bottomStart.subtract(other.bottomStart),
      this.bottomEnd.subtract(other.bottomEnd),
    )
  }

  multiply (other: number): AtBorderRadiusGeometry  {
    return AtBorderRadiusDirectional.only(
      this.topStart.multiply(other),
      this.topEnd.multiply(other),
      this.bottomStart.multiply(other),
      this.bottomEnd.multiply(other),
    )
  }

  divide (other: number): AtBorderRadiusGeometry  {
    return AtBorderRadiusDirectional.only(
      this.topStart.divide(other),
      this.topEnd.divide(other),
      this.bottomStart.divide(other),
      this.bottomEnd.divide(other),
    )
  }

  modulo (other: number): AtBorderRadiusGeometry  {
    return AtBorderRadiusDirectional.only(
      this.topStart.modulo(other),
      this.topEnd.modulo(other),
      this.bottomStart.modulo(other),
      this.bottomEnd.modulo(other),
    )
  }
  
  resolve (direction: TextDirection | null): AtBorderRadius {
    invariant(direction !== null)

    if (direction === At.TextDirection.RTL) {
      return AtBorderRadius.only(
        this.topEnd,
        this.topStart,
        this.bottomEnd,
        this.bottomStart,
      )
    } else {
      return AtBorderRadius.only(
        this.topStart,
        this.topEnd,
        this.bottomStart,
        this.bottomEnd,
      )
    }
  }
}

export class AtMixedBorderRadius extends AtBorderRadiusGeometry {
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

  negate (): AtMixedBorderRadius {
    return new AtMixedBorderRadius(
      this.topLeft.negate(),
      this.topRight.negate(),
      this.bottomLeft.negate(),
      this.bottomRight.negate(),
      this.topStart.negate(),
      this.topEnd.negate(),
      this.bottomStart.negate(),
      this.bottomEnd.negate(),
    )
  }

  add (other: AtMixedBorderRadius): AtMixedBorderRadius {
    return new AtMixedBorderRadius(
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

  subtract (other: AtMixedBorderRadius): AtMixedBorderRadius {
    return new AtMixedBorderRadius(
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

  multiply (other: number): AtMixedBorderRadius {
    return new AtMixedBorderRadius(
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

  divide (other: number): AtMixedBorderRadius {
    return new AtMixedBorderRadius(
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

  modulo (other: number): AtMixedBorderRadius {
    return new AtMixedBorderRadius(
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
  
  resolve (direction: TextDirection | null): AtBorderRadius {
    invariant(direction !== null)

    if (direction === At.TextDirection.RTL) {
      return AtBorderRadius.only(
        this.topLeft.add(this.topEnd),
        this.topRight.add(this.topStart),
        this.bottomLeft.add(this.bottomEnd),
        this.bottomRight.add(this.bottomStart),
      )
    } else {
      return AtBorderRadius.only(
        this.topLeft.add(this.topStart),
        this.topRight.add(this.topEnd),
        this.bottomLeft.add(this.bottomStart),
        this.bottomRight.add(this.bottomEnd),
      )
    }
  }
}
