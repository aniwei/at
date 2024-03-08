import { Box } from './box'

//// => PositionedBox
export interface PositionedBoxOptions {
  child: Box,
  left?: number,
  top?: number,
  right?: number,
  bottom?: number,
  width?: number,
  height?: number,
}

export class PositionedBox extends Box {
  /**
   * 创建 Positioned 对象
   * @param {PositionedBoxOptions} options 
   * @returns {PositionedBox}
   */
  static create (options: PositionedBoxOptions) {
    return new PositionedBox(
      options.child,
      options.left,
      options.top,
      options.right,
      options.bottom,
      options.width,
      options.height,
    )
  }

  // => left
  // 坐标
  protected _left: number | null = null
  public get left () {
    return this._left
  }
  public set left (left: number | null) {
    if (this._left === null || this._left !== left) {
      this._left = left
      this.markNeedsLayout()
    }
  }

  // => top
  // 坐标
  protected _top: number | null = null
  public get top () {
    return this._top
  }
  public set top (top: number | null) {
    if (this._top === null || this._top !== top) {
      this._top = top
      this.markNeedsLayout()
    }
  }

  // => right
  // 右坐标
  protected _right: number | null = null
  public get right () {
    return this._right
  }
  public set right (right: number | null) {
    if (this._right === null || this._right !== right) {
      this._right = right
      this.markNeedsLayout()
    }
  }

  // => bottom
  // 底部坐标
  protected _bottom: number | null = null
  public get bottom () {
    return this._bottom
  }
  public set bottom (bottom: number | null) {
    if (this._bottom === null || this._bottom !== bottom) {
      this._bottom = bottom
      this.markNeedsLayout()
    }
  }
  
  // => width
  // 宽度
  protected _width: number | null = null
  public get width () {
    return this._width
  }
  public set width (width: number | null) {
    if (
      this._width === null || 
      this._width !== width
    ) {
      this._width = width
      this.markNeedsLayout()
    }
  }

  // => height
  // 高度
  protected _height: number | null = null
  public get height () {
    return this._height
  }
  public set height (height: number | null) {
    if (
      this._height === null || 
      this._height !== height
    ) {
      this._height = height
      this.markNeedsLayout()
    }
  }

  // => positioned
  public get positioned () {
    return (
      this.left !== null || 
      this.top !== null || 
      this.right !== null || 
      this.bottom !== null || 
      this.width !== null || 
      this.height !== null
    )
  }

  // => child
  public get child () {
    return super.child as Box
  }

  constructor (
    child: Box,
    left: number | null = null,
    top: number | null = null,
    right: number | null = null,
    bottom: number | null = null,
    width: number | null = null,
    height: number | null = null
  ) {
    super([child])
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
    this.width = width
    this.height = height    
  }

  markNeedsLayout (): void {
    super.markNeedsLayout()

    if (this.needsLayout) {
      this.parent?.markNeedsLayout()
    }
  }
}