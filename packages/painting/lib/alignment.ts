import { invariant } from 'ts-invariant'
import { lerp } from '../basic/helper'
import { TextDirection } from '../engine/skia'
import { Offset, Rect, Size } from '../basic/geometry'
import { At } from '../at'

export abstract class AtAlignmentGeometry {
  
  /**
   * 插值计算
   * @param {AtAlignmentGeometry | null} a
   * @param {AtAlignmentGeometry | null} b
   * @param {number} t
   * @return {AtAlignmentGeometry | null}
   */
  static lerp(
    a: AtAlignmentGeometry | null, 
    b: AtAlignmentGeometry | null, 
    t: number
  ): AtAlignmentGeometry | null {
    invariant(t !== null, `The argument t cannot be null.`)

    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return (b as AtAlignmentGeometry).multiply(t)
    }

    if (b === null) {
      return a.multiply(1.0 - t)
    }

    if (a instanceof AtAlignment && b instanceof AtAlignment) {
      return AtAlignment.lerp(a, b, t)
    }

    if (a instanceof AtAlignmentDirectional && b instanceof AtAlignmentDirectional) {
      return AtAlignmentDirectional.lerp(a, b, t)
    }

    return new AtMixedAlignment(
      lerp(a.x, b.x, t),
      lerp(a.y, b.y, t),
      lerp(a.start, b.start, t),
    )
  }

  public start: number
  public x: number
  public y: number

  /**
   * 
   * @param x 
   * @param y 
   * @param start 
   */
  constructor (x: number, y: number, start: number) {
    this.x = x
    this.y = y
    this.start = start
  }
  
  abstract add (other: AtAlignmentGeometry): AtAlignmentGeometry
  abstract substract (other: AtAlignmentGeometry): AtAlignmentGeometry 
  abstract multiply (other: number): AtAlignmentGeometry 
  abstract divide (other: number): AtAlignmentGeometry
  abstract modulo (other: number): AtAlignmentGeometry
  abstract negate (): AtAlignmentGeometry 
  abstract resolve (direction: TextDirection | null): AtAlignment

  equal (other: AtAlignmentGeometry | null) {
    return (
      other instanceof AtAlignmentGeometry &&
      other.x === this.x &&
      other.y === this.y &&
      other.start === this.start
    )
  }

  notEqual (other: AtAlignmentGeometry | null) {
    return !this.equal(other)
  }

  toString () {
    return `AtAlignmentGeometry(x: ${this.x}, y: ${this.y}, start: ${this.start})`
  }
}

export class AtAlignment extends AtAlignmentGeometry {
  static topLeft = new AtAlignment(-1.0, -1.0)
  static topCenter = new AtAlignment(0.0, -1.0)
  static topRight = new AtAlignment(1.0, -1.0)
  static centerLeft = new AtAlignment(-1.0, 0.0)
  static center = new AtAlignment(0.0, 0.0)
  static centerRight = new AtAlignment(1.0, 0.0)
  static bottomLeft = new AtAlignment(-1.0, 1.0)
  static bottomCenter = new AtAlignment(0.0, 1.0)
  static bottomRight = new AtAlignment(1.0, 1.0)

  /**
   * 插值计算
   * @param {AtAlignment | null} a
   * @param {AtAlignment | null} b
   * @param {number} t
   * @return {AtAlignment | nulls}
   */
  static lerp(a: AtAlignment | null, b: AtAlignment | null, t: number): AtAlignment | null {
    invariant(t !== null, `The argument t cannot be null.`)

    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return new AtAlignment(
        lerp(0.0, (b as AtAlignment).x, t), 
        lerp(0.0, (b as AtAlignment).y, t)
      )
    }

    if (b === null) {
      return new AtAlignment(
        lerp(a.x, 0.0, t), 
        lerp(a.y, 0.0, t)
      )
    }

    return new AtAlignment(
      lerp(a.x, b.x, t), 
      lerp(a.y, b.y, t)
    )
  }

  /**
   * @description: 
   * @param {number} x
   * @param {number} y
   * @return {AtAlignment}
   */  
  constructor (x: number,y: number) {
    super(x, y, 0)
  }

  /**
   * @description: 
   * @return {*}
   */  
  negate () {
    return new AtAlignment(-this.x, -this.y,)
  }

  /**
   * @description: 
   * @param {AtAlignment} other
   * @return {*}
   */  
  substract (other: AtAlignment): AtAlignment {
    return new AtAlignment(
      this.x - other.x,
      this.y - other.y
    )
  }

  add (other: AtAlignment): AtAlignment {
    return new AtAlignment(
      this.x + other.x, 
      this.y + other.y
    )
  }

  divide (other: number): AtAlignment {
    return new AtAlignment(
      this.x / other, 
      this.y / other
    )
  }

  multiply (other: number): AtAlignment {
    return new AtAlignment(
      this.x * other, 
      this.y * other
    )
  }

  modulo (other: number): AtAlignment {
    return new AtAlignment(
      this.x % other, 
      this.y % other
    )
  }

  alongOffset (other: Offset) {
    const centerX = other.dx / 2.0
    const centerY = other.dy / 2.0
    
    return new Offset(
      centerX + this.x * centerX, 
      centerY + this.y * centerY
    )
  }

  alongSize (other: Size) {
    const centerX = other.width / 2.0
    const centerY = other.height / 2.0
    return new Offset(
      centerX + this.x * centerX, 
      centerY + this.y * centerY
    )
  }

  withinRect (rect: Rect) {
    const halfWidth = rect.width / 2
    const halfHeight = rect.height / 2

    return new Offset(
      rect.left + halfWidth + this.x * halfWidth,
      rect.top + halfHeight + this.y * halfHeight,
    )
  }

  inscribe (size: Size, rect: Rect) {
    const halfWidthDelta = (rect.width - size.width) / 2.0
    const halfHeightDelta = (rect.height - size.height) / 2.0

    return Rect.fromLTWH(
      rect.left + halfWidthDelta + this.x * halfWidthDelta,
      rect.top + halfHeightDelta + this.y * halfHeightDelta,
      size.width,
      size.height,
    )
  }

  resolve (direction: TextDirection | null): AtAlignment {
    return this
  } 

  toString () {
    return `AtAlignment(${this.x}, ${this.y}, ${this.start})`
  }
}


export class AtAlignmentDirectional extends AtAlignmentGeometry {
  static topStart = new AtAlignmentDirectional(-1.0, -1.0)
  static topCenter = new AtAlignmentDirectional(0.0, -1.0)
  static topEnd = new AtAlignmentDirectional(1.0, -1.0)
  static centerStart = new AtAlignmentDirectional(-1.0, 0.0)
  static center = new AtAlignmentDirectional(0.0, 0.0)
  static centerEnd = new AtAlignmentDirectional(1.0, 0.0)
  static bottomStart = new AtAlignmentDirectional(-1.0, 1.0)
  static bottomCenter = new AtAlignmentDirectional(0.0, 1.0)
  static bottomEnd = new AtAlignmentDirectional(1.0, 1.0)

  /**
   * @description: 
   * @param {AtAlignmentDirectional | null} a
   * @param {AtAlignmentDirectional | null} b
   * @param {number} t
   * @return {AtAlignmentDirectional | null}
   */
  static lerp (
    a: AtAlignmentDirectional | null, 
    b: AtAlignmentDirectional | null, 
    t: number
  ): AtAlignmentDirectional | null {
    invariant(t !== null, `The argument t cannot be null.`)
    
    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return new AtAlignmentDirectional(
        lerp(0, (b as AtAlignmentDirectional).start, t)!, 
        lerp(0, (b as AtAlignmentDirectional).y, t)!
      )
    }
    if (b === null) {
      return new AtAlignmentDirectional(lerp(a.start, 0, t), lerp(a.y, 0, t))
    }

    return new AtAlignmentDirectional(lerp(a.start, b.start, t), lerp(a.y, b.y, t))
  }

  /**
   * @description: 
   * @param {number} y
   * @param {number} start
   * @return {*}
   */  
  constructor (y: number, start: number ) {
    invariant(y !== null, `The argument y cannot be null.`)
    invariant(start !== null, `The argument start cannot be null.`)

    super(0, y, start)
  }

  add (other: AtAlignmentGeometry): AtAlignmentGeometry {
    return new AtAlignmentDirectional(
      this.start + other.start, 
      this.y + other.y
    )
  }
  
  substract (other: AtAlignmentDirectional): AtAlignmentGeometry {
    return new AtAlignmentDirectional(
      this.start - other.start, 
      this.y - other.y
    )
  }

  negate () {
    return new AtAlignmentDirectional(
      -this.start, 
      -this.y
    )
  }
  
  multiply (other: number) {
    return new AtAlignmentDirectional(
      this.start * other, 
      this.y * other
    )
  }

  divide (other: number) {
    return new AtAlignmentDirectional(
      this.start / other, 
      this.y / other
    )
  }
   
  modulo (other: number) {
    return new AtAlignmentDirectional(
      this.start % other, 
      this.y % other
    )
  }
  
  resolve (direction: TextDirection | null): AtAlignment {
    invariant(direction !== null, 'Cannot resolve AtAlignmentDirectional without a TextDirection.')

    if (direction === At.TextDirection.RTL) {
      return new AtAlignment(-this.start, this.y)
    } else {
      return new AtAlignment(this.start, this.y) 
    }
  }

  toString () {
    return `AtAlignmentDirectional(${this.y}, ${this.start})`
  }
}

export class AtMixedAlignment extends AtAlignmentGeometry {
  /**
   * @description: 
   * @param {number} x
   * @param {number} y
   * @param {number} start
   * @return {AtMixedAlignment}
   */  
  constructor (x: number, y: number, start: number) {
    super(x, y, start)

    this.x = x
    this.y = y
    this.start = start
  }

  negate (): AtMixedAlignment {
    return new AtMixedAlignment(-this.x, -this.start, -this.y)
  }

  add (other: AtMixedAlignment) {
    return new AtMixedAlignment(
      this.x + other.x,
      this.y + other.y,
      this.start + other.start,
    )
  }

  substract (other: AtMixedAlignment): AtMixedAlignment {
    return new AtMixedAlignment(
      this.x - other.x,
      this.y - other.y,
      this.start - other.start,
    )
  }

  multiply (other: number): AtMixedAlignment {
    return new AtMixedAlignment(
      this.x * other,
      this.y * other,
      this.start * other,
    )
  }
  
  divide (other: number): AtMixedAlignment {
    return new AtMixedAlignment(
      this.x / other,
      this.y / other,
      this.start / other,
    )
  }

  /**
   * @description: 
   * @param {number} other
   * @return {*}
   */  
  modulo (other: number): AtMixedAlignment  {
    return new AtMixedAlignment(
      this.x % other,
      this.y % other,
      this.start % other,
    );
  }

  /**
   * @description: 
   * @param {TextDirection} direction
   * @return {*}
   */  
  resolve (direction: TextDirection | null): AtAlignment {
    invariant(direction !== null, 'Cannot resolve AtMixedAlignment without a TextDirection.')

    if (direction === At.TextDirection.RTL) {
      return new AtAlignment(
        this.x - this.start, 
        this.y
      )
    } else {
      return new AtAlignment(
        this.x + this.start, 
        this.y
      )
    }
  }

  toString () {
    return `AtMixedAlignment()`
  }
}

export class AtTextAlignVertical {
  public y: number

  constructor (y: number) {
    invariant(y !== null, `The argument y cannot be null.`)
    invariant(y >= -1.0 && y <= 1.0)
    this.y = y
  }
  
  static top = new AtTextAlignVertical(-1.0)
  static center = new AtTextAlignVertical(0.0)
  static bottom = new AtTextAlignVertical(1.0)

  toString () {
    return `AtAlignment.AtTextAlignVectical(${this.y})`
  }
}
