import { invariant, clamp, lerp } from '@at/utils'
import { Size } from '@at/geometry'
import { Equalable } from '@at/basic'
import type { EdgeInsets } from '@at/painting'


//// => Constraints
// 约束
export interface ConstraintsFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
}
export abstract class Constraints extends Equalable<Constraints> {
  static create <T extends Constraints> (...rests: unknown[]) {
    const ConstraintsFactory = this as unknown as ConstraintsFactory<T>
    return new ConstraintsFactory(...rests) as Constraints
  }

  abstract tight: boolean
  abstract normalized: boolean
}

//// => BoxConstraints
// 盒子模型约束
export interface BoxConstraintsOptions {
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
}

export class BoxConstraints extends Constraints {
  static create (options: BoxConstraintsOptions) {
    options.minWidth ??= 0
    options.maxWidth ??= Number.POSITIVE_INFINITY
    options.minHeight ??= 0
    options.maxHeight ??= Number.POSITIVE_INFINITY

    return new BoxConstraints(
      options.minWidth,
      options.maxWidth,
      options.minHeight,
      options.maxHeight
    ) as BoxConstraints
  }

  static lerp (
    a: BoxConstraints | null = null, 
    b: BoxConstraints | null = null, 
    t: number
  ): BoxConstraints | null {
    invariant(t !== null)
    if (a === null && b === null) {
      return null
    }

    if (a === null) {
      return b!.multiply(t)
    }

    if (b === null) {
      return a.multiply(1.0 - t)
    }
    
    return BoxConstraints.create({
      minWidth: Number.isFinite(a.minWidth) 
        ? lerp(a.minWidth, b.minWidth, t) 
        : Number.POSITIVE_INFINITY,
      maxWidth: Number.isFinite(a.maxWidth) 
        ? lerp(a.maxWidth, b.maxWidth, t)
        : Number.POSITIVE_INFINITY,
      minHeight: Number.isFinite(a.minHeight) 
        ? lerp(a.minHeight, b.minHeight, t)
        : Number.POSITIVE_INFINITY,
      maxHeight: Number.isFinite(a.maxHeight) 
        ? lerp(a.maxHeight, b.maxHeight, t)
        : Number.POSITIVE_INFINITY,
    })
  }

  static tight (size: Size) {
    return BoxConstraints.create({
      minWidth: size.width,
      maxWidth: size.width,
      minHeight: size.height,
      maxHeight: size.height
    })
  }

  /**
   * 约束
   * @param {number | Size | null} width 
   * @param {number | null | undefined} height
   */
  static tightFor (width: number | null = null, height: number | null = null): BoxConstraints {
    return BoxConstraints.create({
      minWidth: width ?? 0,
      maxWidth: width ?? Number.POSITIVE_INFINITY,
      minHeight: height ?? 0,
      maxHeight: height ?? Number.POSITIVE_INFINITY
    })
  }

  static tightForFinite (
    width: number = Number.POSITIVE_INFINITY,
    height: number = Number.POSITIVE_INFINITY,
  ) {
    return BoxConstraints.create({
      minWidth: width !== Number.POSITIVE_INFINITY ? width : 0.0,
      maxWidth: width !== Number.POSITIVE_INFINITY ? width : Number.POSITIVE_INFINITY,
      minHeight: height !== Number.POSITIVE_INFINITY ? height : 0.0,
      maxHeight: height !== Number.POSITIVE_INFINITY ? height : Number.POSITIVE_INFINITY
    })
  }

  static loose (size: Size) {
    return BoxConstraints.create({
      minWidth: 0.0,
      maxWidth: size.width,
      minHeight: 0.0,
      maxHeight: size.height
    })
  }
    
  static expand (width: number | null = null, height: number | null = null) {
    return BoxConstraints.create({
      minWidth: width ?? Number.POSITIVE_INFINITY,
      maxWidth: width ?? Number.POSITIVE_INFINITY,
      minHeight: height ?? Number.POSITIVE_INFINITY,
      maxHeight: height ?? Number.POSITIVE_INFINITY,
    })
  }
  
  // => normalized
  public get normalized () {
    return (
      this.minWidth >= 0.0 &&
      this.minWidth <= this.maxWidth &&
      this.minHeight >= 0.0 &&
      this.minHeight <= this.maxHeight
    )
  }

  // => flipped
  public get flipped () {
    return BoxConstraints.create({
      minWidth: this.minHeight,
      maxWidth: this.maxHeight,
      minHeight: this.minWidth,
      maxHeight: this.maxWidth,
    })
  }

  // => biggest
  get biggest () {
    return new Size(
      this.constrainWidth(), 
      this.constrainHeight()
    )
  }

  // => smallest
  get smallest () {
    return new Size(
      this.constrainWidth(0.0), 
      this.constrainHeight(0.0)
    )
  } 
  
  // => hasTightWidth
  public get hasTightWidth () {
    return this.minWidth >= this.maxWidth
  }
  
  // => hasTightHeight
  public get hasTightHeight () {
    return this.minHeight >= this.maxHeight
  }
  
  // => tight
  public get tight () {
    return this.hasTightWidth && this.hasTightHeight
  }
  
  // => hasBoundedWidth
  public get hasBoundedWidth () {
    return this.maxWidth < Number.POSITIVE_INFINITY
  }
  
  // => hasBoundedHeight
  public get hasBoundedHeight () {
    return this.maxHeight < Number.POSITIVE_INFINITY
  }
  
  // => hasInfiniteWidth}
  public get hasInfiniteWidth () {
    return this.minWidth >= Number.POSITIVE_INFINITY
  }

  // => hasInfiniteHeight
  public get hasInfiniteHeight () {
    return this.minHeight >= Number.POSITIVE_INFINITY
  }
  

  public minWidth: number
  public maxWidth: number
  public minHeight: number
  public maxHeight: number

  constructor (
    minWidth: number = 0,
    maxWidth: number = Number.POSITIVE_INFINITY,
    minHeight: number = 0,
    maxHeight: number = Number.POSITIVE_INFINITY
  ) {
    super()

    this.minWidth = minWidth
    this.maxWidth = maxWidth
    this.minHeight = minHeight
    this.maxHeight = maxHeight
  }
    
  tighten (
    width: number | null = null, 
    height: number | null = null 
  ): BoxConstraints {
    return new BoxConstraints(
      width === null 
        ? this.minWidth 
        : clamp(width, this.minWidth, this.maxWidth),
      width === null 
        ? this.maxWidth 
        : clamp(width, this.minWidth, this.maxWidth),
      height === null 
        ? this.minHeight 
        : clamp(height, this.minHeight, this.maxHeight),
      height === null 
        ? this.maxHeight 
        : clamp(height, this.minHeight, this.maxHeight),
    )
  }

  copyWith(
    minWidth: number | null = null,
    maxWidth: number | null = null,
    minHeight: number | null = null,
    maxHeight: number | null = null,
  ) {
    return new BoxConstraints(
      minWidth ?? this.minWidth,
      maxWidth ?? this.maxWidth,
      minHeight ?? this.minHeight,
      maxHeight ?? this.maxHeight,
    )
  }

  deflate (edges: EdgeInsets) {
    invariant(edges !== null)
    const horizontal: number = edges.horizontal
    const vertical: number = edges.vertical
    const deflatedMinWidth: number = Math.max(0.0, this.minWidth - horizontal)
    const deflatedMinHeight: number = Math.max(0.0, this.minHeight - vertical)

    return new BoxConstraints(
      deflatedMinWidth,
      Math.max(deflatedMinWidth, this.maxWidth - horizontal),
      deflatedMinHeight,
      Math.max(deflatedMinHeight, this.maxHeight - vertical),
    )
  }

  loosen (): BoxConstraints {
    return new BoxConstraints(
      0.0,
      this.maxWidth,
      0.0,
      this.maxHeight,
    )
  }

  enforce (constraints: BoxConstraints): BoxConstraints {
    return new BoxConstraints(
      clamp(this.minWidth, constraints.minWidth, constraints.maxWidth),
      clamp(this.maxWidth, constraints.minWidth, constraints.maxWidth),
      clamp(this.minHeight, constraints.minHeight, constraints.maxHeight),
      clamp(this.maxHeight, constraints.minHeight, constraints.maxHeight),
    )
  }
  
  widthConstraints (): BoxConstraints  {
    return BoxConstraints.create({
      minWidth: this.minWidth, 
      maxWidth: this.maxWidth
    })
  }

  heightConstraints (): BoxConstraints {
    return BoxConstraints.create({
      minHeight: this.minHeight, 
      maxHeight: this.maxHeight
    })
  }

  constrainWidth (width: number = Number.POSITIVE_INFINITY) {
    return clamp(
      width, 
      this.minWidth, 
      this.maxWidth
    )
  }

  constrainHeight (height = Number.POSITIVE_INFINITY) {
    return clamp(
      height, 
      this.minHeight, 
      this.maxHeight
    )
  }

  constrain (size: Size): Size {
    const result: Size = new Size(
      this.constrainWidth(size.width), 
      this.constrainHeight(size.height)
    )

    return result
  }

  constrainDimensions (
    width: number, 
    height: number
  ): Size {
    return new Size(
      this.constrainWidth(width), 
      this.constrainHeight(height)
    )
  }

  constrainSizeAndAttemptToPreserveAspectRatio (size: Size) {
    if (this.tight) {
      return this.smallest
    }

    let width = size.width
    let height = size.height
    invariant(width > 0.0)
    invariant(height > 0.0)
    const aspectRatio = width / height

    if (width > this.maxWidth) {
      width = this.maxWidth
      height = width / aspectRatio
    }

    if (height > this.maxHeight) {
      height = this.maxHeight
      width = height * aspectRatio
    }

    if (width < this.minWidth) {
      width = this.minWidth
      height = width / aspectRatio
    }

    if (height < this.minHeight) {
      height = this.minHeight
      width = height * aspectRatio
    }

    return Size.create(
      this.constrainWidth(width), 
      this.constrainHeight(height)
    )
  }

  isSatisfiedBy (size: Size) {
    return (
      this.minWidth <= size.width && 
      size.width <= this.maxWidth &&
      this.minHeight <= size.height && 
      size.height <= this.maxHeight
    )
  }

  multiply (factor: number) {
    return BoxConstraints.create({
      minWidth: this.minWidth * factor,
      maxWidth: this.maxWidth * factor,
      minHeight: this.minHeight * factor,
      maxHeight: this.maxHeight * factor,
    })
  }

  divide (factor: number) {
    return BoxConstraints.create({
      minWidth: this.minWidth / factor,
      maxWidth: this.maxWidth / factor,
      minHeight: this.minHeight / factor,
      maxHeight: this.maxHeight / factor,
    })
  }

  module (value: number) {
    return BoxConstraints.create({
      minWidth: this.minWidth % value,
      maxWidth: this.maxWidth % value,
      minHeight: this.minHeight % value,
      maxHeight: this.maxHeight % value,
    })
  }

  normalize (): BoxConstraints  {
    if (this.normalized) {
      return this;
    }
    const minWidth = this.minWidth >= 0 ? this.minWidth : 0
    const minHeight = this.minHeight >= 0 ? this.minHeight : 0

    return BoxConstraints.create({
      minWidth: minWidth,
      maxWidth: minWidth > this.maxWidth ? minWidth : this.maxWidth,
      minHeight: minHeight,
      maxHeight: minHeight > this.maxHeight ? minHeight : this.maxHeight,
    })
  }

  equal (other: BoxConstraints | null) {
    return (
      other instanceof BoxConstraints &&
      other.minWidth === this.minWidth &&
      other.maxWidth === this.maxWidth &&
      other.minHeight === this.minHeight &&
      other.maxHeight === this.maxHeight
    )
  }

  notEqual (other: BoxConstraints | null) {
    return !this.equal(other)
  }
  
  toString () {
    return `BoxConstraints(
      [minWidth]: ${this.minWidth}, 
      [maxWidth]: ${this.maxWidth}, 
      [minHeight]: ${this.minHeight}, 
      [maxHeight]: ${this.maxHeight}
    )`
  }
}
