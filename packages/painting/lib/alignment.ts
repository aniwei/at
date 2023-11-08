import { invariant } from '@at/utils'
import { lerp } from '@at/basic'
import { TextDirection } from '../engine/skia'
import { Offset, Rect, Size } from '@at/geometry'
import { At } from '../at'


export abstract class AlignmentGeometry extends Computable<AlignmentGeometry> {
  /**
   * 插值计算
   * @param {AlignmentGeometry | null} a
   * @param {AlignmentGeometry | null} b
   * @param {number} t
   * @return {AlignmentGeometry | null}
   */
  static lerp(
    a: AlignmentGeometry | null, 
    b: AlignmentGeometry | null, 
    t: number
  ): AlignmentGeometry | null {
    invariant(t !== null, `The argument t cannot be null.`)

    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return (b as AlignmentGeometry).multiply(t)
    }

    if (b === null) {
      return a.multiply(1.0 - t)
    }

    if (a instanceof Alignment && b instanceof Alignment) {
      return Alignment.lerp(a, b, t)
    }

    if (a instanceof AlignmentDirectional && b instanceof AlignmentDirectional) {
      return AlignmentDirectional.lerp(a, b, t)
    }

    return new MixedAlignment(
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
  
  abstract add (other: AlignmentGeometry): AlignmentGeometry
  abstract substract (other: AlignmentGeometry): AlignmentGeometry 
  abstract multiply (other: number): AlignmentGeometry 
  abstract divide (other: number): AlignmentGeometry
  abstract modulo (other: number): AlignmentGeometry
  abstract negate (): AlignmentGeometry 
  abstract resolve (direction: TextDirection | null): Alignment

  equal (other: AlignmentGeometry | null) {
    return (
      other instanceof AlignmentGeometry &&
      other.x === this.x &&
      other.y === this.y &&
      other.start === this.start
    )
  }

  notEqual (other: AlignmentGeometry | null) {
    return !this.equal(other)
  }

  toString () {
    return `AlignmentGeometry(x: ${this.x}, y: ${this.y}, start: ${this.start})`
  }
}

export class Alignment extends AlignmentGeometry {
  static TOP_LEFT = new Alignment(-1.0, -1.0)
  static TOP_CENTER = new Alignment(0.0, -1.0)
  static TOP_RIGHT = new Alignment(1.0, -1.0)

  static CENTER_LEFT = new Alignment(-1.0, 0.0)
  static CENTER_CENTER = new Alignment(0.0, 0.0)
  static CENTER_RIGHT = new Alignment(1.0, 0.0)

  static BUTTON_LEFT = new Alignment(-1.0, 1.0)
  static BUTTON_CENTER = new Alignment(0.0, 1.0)
  static BUTTON_RIGHT = new Alignment(1.0, 1.0)

  /**
   * 插值计算
   * @param {Alignment | null} a
   * @param {Alignment | null} b
   * @param {number} t
   * @return {Alignment | nulls}
   */
  static lerp(
    a: Alignment | null, 
    b: Alignment | null, 
    t: number
  ): Alignment | null {
    invariant(t !== null, 'The argument "t" cannot be null.')

    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return new Alignment(
        lerp(0.0, (b as Alignment).x, t), 
        lerp(0.0, (b as Alignment).y, t)
      )
    }

    if (b === null) {
      return new Alignment(
        lerp(a.x, 0.0, t), 
        lerp(a.y, 0.0, t)
      )
    }

    return new Alignment(
      lerp(a.x, b.x, t), 
      lerp(a.y, b.y, t)
    )
  }

  /**
   * @description: 
   * @param {number} x
   * @param {number} y
   * @return {Alignment}
   */  
  constructor (x: number,y: number) {
    super(x, y, 0)
  }

  /**
   * @description: 
   * @return {*}
   */  
  inverse () {
    return new Alignment(-this.x, -this.y,)
  }

  /**
   * @description: 
   * @param {Alignment} other
   * @return {*}
   */  
  substract (other: Alignment): Alignment {
    return new Alignment(
      this.x - other.x,
      this.y - other.y
    )
  }

  add (other: Alignment): Alignment {
    return new Alignment(
      this.x + other.x, 
      this.y + other.y
    )
  }

  divide (other: number): Alignment {
    return new Alignment(
      this.x / other, 
      this.y / other
    )
  }

  multiply (other: number): Alignment {
    return new Alignment(
      this.x * other, 
      this.y * other
    )
  }

  modulo (other: number): Alignment {
    return new Alignment(
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

  resolve (direction: TextDirection | null): Alignment {
    return this
  } 

  toString () {
    return `Alignment(${this.x}, ${this.y}, ${this.start})`
  }
}


export class AlignmentDirectional extends AlignmentGeometry {
  static topStart = new AlignmentDirectional(-1.0, -1.0)
  static topCenter = new AlignmentDirectional(0.0, -1.0)
  static topEnd = new AlignmentDirectional(1.0, -1.0)
  static centerStart = new AlignmentDirectional(-1.0, 0.0)
  static center = new AlignmentDirectional(0.0, 0.0)
  static centerEnd = new AlignmentDirectional(1.0, 0.0)
  static bottomStart = new AlignmentDirectional(-1.0, 1.0)
  static bottomCenter = new AlignmentDirectional(0.0, 1.0)
  static bottomEnd = new AlignmentDirectional(1.0, 1.0)

  /**
   * @description: 
   * @param {AlignmentDirectional | null} a
   * @param {AlignmentDirectional | null} b
   * @param {number} t
   * @return {AlignmentDirectional | null}
   */
  static lerp (
    a: AlignmentDirectional | null, 
    b: AlignmentDirectional | null, 
    t: number
  ): AlignmentDirectional | null {
    invariant(t !== null, `The argument t cannot be null.`)
    
    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return new AlignmentDirectional(
        lerp(0, (b as AlignmentDirectional).start, t)!, 
        lerp(0, (b as AlignmentDirectional).y, t)!
      )
    }
    if (b === null) {
      return new AlignmentDirectional(lerp(a.start, 0, t), lerp(a.y, 0, t))
    }

    return new AlignmentDirectional(lerp(a.start, b.start, t), lerp(a.y, b.y, t))
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

  add (other: AlignmentGeometry): AlignmentGeometry {
    return new AlignmentDirectional(
      this.start + other.start, 
      this.y + other.y
    )
  }
  
  substract (other: AlignmentDirectional): AlignmentGeometry {
    return new AlignmentDirectional(
      this.start - other.start, 
      this.y - other.y
    )
  }

  negate () {
    return new AlignmentDirectional(
      -this.start, 
      -this.y
    )
  }
  
  multiply (other: number) {
    return new AlignmentDirectional(
      this.start * other, 
      this.y * other
    )
  }

  divide (other: number) {
    return new AlignmentDirectional(
      this.start / other, 
      this.y / other
    )
  }
   
  modulo (other: number) {
    return new AlignmentDirectional(
      this.start % other, 
      this.y % other
    )
  }
  
  resolve (direction: TextDirection | null): Alignment {
    invariant(direction !== null, 'Cannot resolve AlignmentDirectional without a TextDirection.')

    if (direction === At.TextDirection.RTL) {
      return new Alignment(-this.start, this.y)
    } else {
      return new Alignment(this.start, this.y) 
    }
  }

  toString () {
    return `AlignmentDirectional(${this.y}, ${this.start})`
  }
}

export class MixedAlignment extends AlignmentGeometry {
  /**
   * @description: 
   * @param {number} x
   * @param {number} y
   * @param {number} start
   * @return {MixedAlignment}
   */  
  constructor (x: number, y: number, start: number) {
    super(x, y, start)

    this.x = x
    this.y = y
    this.start = start
  }

  negate (): MixedAlignment {
    return new MixedAlignment(-this.x, -this.start, -this.y)
  }

  add (other: MixedAlignment) {
    return new MixedAlignment(
      this.x + other.x,
      this.y + other.y,
      this.start + other.start,
    )
  }

  substract (other: MixedAlignment): MixedAlignment {
    return new MixedAlignment(
      this.x - other.x,
      this.y - other.y,
      this.start - other.start,
    )
  }

  multiply (other: number): MixedAlignment {
    return new MixedAlignment(
      this.x * other,
      this.y * other,
      this.start * other,
    )
  }
  
  divide (other: number): MixedAlignment {
    return new MixedAlignment(
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
  modulo (other: number): MixedAlignment  {
    return new MixedAlignment(
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
  resolve (direction: TextDirection | null): Alignment {
    invariant(direction !== null, 'Cannot resolve MixedAlignment without a TextDirection.')

    if (direction === At.TextDirection.RTL) {
      return new Alignment(
        this.x - this.start, 
        this.y
      )
    } else {
      return new Alignment(
        this.x + this.start, 
        this.y
      )
    }
  }

  toString () {
    return `MixedAlignment()`
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
    return `Alignment.AtTextAlignVectical(${this.y})`
  }
}
