import { Offset } from '@at/geometry'
import { HitTestEntry, HitTestResult, HitTestResultOptions } from '@at/gesture'
import { Matrix4, MatrixUtils } from '@at/math'
import { invariant } from '@at/utils'
import { Box } from './box'

/// => BoxHitTestHandle
export interface BoxHitTestHandle {
  (
    result: BoxHitTestResult, 
    position: Offset
  ): boolean
}

export interface BoxHitTestWithOutOfBandPositionHandle {
  (result: BoxHitTestResult): boolean
}

//// => BoxHitTestResult
// 盒子碰撞测试结果
export interface BoxHitTestResultOptions extends HitTestResultOptions { }

export class BoxHitTestResult extends HitTestResult {
  /**
   * 静态创建函数
   * @param {HitTestResultOptions} options 
   * @returns {BoxHitTestResult}
   */
  static create (options?: HitTestResultOptions) {
    return new BoxHitTestResult(
      options?.path,
      options?.transforms,
      options?.localTransforms
    )
  }

  /**
   * HitTestResult 包装成 BoxHitTestResult
   * @param {HitTestResult} result 
   * @returns {BoxHitTestResult}
   */
  static wrap (result: HitTestResult) {
    return BoxHitTestResult.create({
      path: result.path,
      transforms: result.transforms,
      localTransforms: result.localTransforms
    })
  }

  /**
   * 
   * @param {Matrix4 | null} transform 
   * @param {Offset} position 
   * @param {BoxHitTestHandle} hitTest 
   * @returns {boolean}
   */
  addWithPaintTransform (
    transform: Matrix4 | null,
    position: Offset,
    hitTest: BoxHitTestHandle,
  ) {
    invariant(position !== null, 'The argument "position" cannot be null.')
    invariant(hitTest !== null, 'The argument "hitTest" cannot be null.')

    if (transform !== null) {
      transform = Matrix4.tryInvert(transform)
      if (transform === null) {
        return false
      }
    }

    return this.addWithRawTransform(
      transform,
      position,
      hitTest,
    )
  }

  /**
   * 
   * @param {Offset} offset 
   * @param {Offset} position 
   * @param {BoxHitTestHandle} hitTest 
   * @returns 
   */
  addWithPaintOffset(
    offset: Offset,
    position: Offset,
    hitTest: BoxHitTestHandle,
  ) {
    invariant(position !== null, 'The argument "position" cannot be null.')
    invariant(hitTest !== null, 'The argument "hitTest" cannot be null.')
    
    const transformedPosition = offset === null 
      ? position 
      : position.subtract(offset)

    if (offset !== null) {
      this.pushOffset(offset.inverse())
    }

    const isHit = hitTest(this, transformedPosition)
    
    if (offset !== null) {
      this.popTransform()
    }

    return isHit
  }

  /**
   * 
   * @param {Matrix4 | null} transform 
   * @param {Offset} position 
   * @param {BoxHitTestHandle} hitTest 
   * @returns 
   */
  addWithRawTransform (
    transform: Matrix4 | null,
    position: Offset,
    hitTest: BoxHitTestHandle,
  ) {
    invariant(position !== null, 'The argument "position" cannot be null.')
    invariant(hitTest !== null, 'The argument "hitTest" cannot be null.')

    const transformedPosition = transform === null 
      ? position 
      : MatrixUtils.transformPoint(transform, position)

    if (transform !== null) {
      this.pushTransform(transform)
    }
    const isHit = hitTest(this, transformedPosition)
    
    if (transform !== null) {
      this.popTransform()
    }

    return isHit
  }

  /**
   * 
   * @param {Offset | null} offset 
   * @param {Matrix4 | null} transform 
   * @param {Matrix4 | null} rawTransform 
   * @param {BoxHitTestWithOutOfBandPositionHandle} hitTest 
   * @returns {boolean}
   */
  addWithOutOfBandPosition(
    offset: Offset | null,
    transform: Matrix4 | null,
    rawTransform: Matrix4 | null,
    hitTest: BoxHitTestWithOutOfBandPositionHandle,
  ) {
    invariant(hitTest !== null, 'The argument "hitTest" cannot be null.')
   
    if (offset !== null) {
      this.pushOffset(offset.inverse())
    } else if (rawTransform !== null) {
      this.pushTransform(rawTransform)
    } else {
      
      invariant(transform !== null, 'The argument "transform" cannot be null.')
      transform = Matrix4.tryInvert(transform)
      invariant(transform !== null, 'The "transform" must be invertible.')

      this.pushTransform(transform)
    }

    const isHit = hitTest(this)
    this.popTransform()

    return isHit
  }
}

//// => BoxHitTestEntry
// 盒子碰撞 Entry
export class BoxHitTestEntry extends HitTestEntry {
  constructor (target: Box, position: Offset) {
    super(target)
    this.localPosition = position
  }

  public localPosition: Offset

  toString () {
    return `BoxHitTestEntry(
      [target]: ${this.localPosition}
    )`
  }
}


