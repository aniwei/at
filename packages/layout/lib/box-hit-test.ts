import { Offset } from '@at/geometry'
import { HitTestEntry, HitTestResult, HitTestResultOptions } from '@at/gesture'
import { Matrix4, MatrixUtils } from '@at/math'
import { invariant } from '@at/utils'
import { Box } from './box'

export type BoxHitTestHandle = (result: BoxHitTestResult, position: Offset ) => boolean
export type BoxHitTestWithOutOfBandPositionHandle = (result: BoxHitTestResult) => boolean

export type BoxHitTestResultOptions = HitTestResultOptions

export class BoxHitTestResult extends HitTestResult {
  static create (options: HitTestResultOptions) {
    return new BoxHitTestResult(
      options.path,
      options.transforms,
      options.localTransforms
    )
  }

  static wrap (result: HitTestResult) {
    return BoxHitTestResult.create({
      path: result.path,
      transforms: result.transforms,
      localTransforms: result.localTransforms
    })
  }

  addWithPaintTransform (
    transform: Matrix4 | null,
    position: Offset,
    hitTest: BoxHitTestHandle,
  ) {
    invariant(position !== null)
    invariant(hitTest !== null)

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

  addWithPaintOffset(
    offset: Offset,
    position: Offset,
    hitTest: BoxHitTestHandle,
  ) {
    invariant(position !== null)
    invariant(hitTest !== null)
    
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

  addWithRawTransform (
    transform: Matrix4 | null,
    position: Offset,
    hitTest: BoxHitTestHandle,
  ) {
    invariant(position !== null)
    invariant(hitTest !== null)
    invariant(position !== null)

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

  addWithOutOfBandPosition(
    paintOffset: Offset | null,
    paintTransform: Matrix4 | null,
    rawTransform: Matrix4 | null,
    hitTest: BoxHitTestWithOutOfBandPositionHandle,
  ) {
    invariant(hitTest !== null)
    invariant(
      (paintOffset === null && paintTransform === null && rawTransform !== null) ||
      (paintOffset === null && paintTransform !== null && rawTransform === null) ||
      (paintOffset !== null && paintTransform === null && rawTransform === null),
      'Exactly one transform or offset argument must be provided.',
    )

    if (paintOffset !== null) {
      this.pushOffset(paintOffset.inverse())
    } else if (rawTransform !== null) {
      this.pushTransform(rawTransform)
    } else {
      invariant(paintTransform !== null)
      paintTransform = Matrix4.tryInvert(paintTransform)

      invariant(paintTransform !== null, 'The "paintTransform" must be invertible.')
      this.pushTransform(paintTransform)
    }

    const isHit = hitTest(this)
    this.popTransform()

    return isHit
  }
}


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


