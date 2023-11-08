import { invariant } from '@at/utils'
import { Offset } from '../basic/geometry'
import { Matrix4 } from '../basic/matrix4'

import type { AtPointerEvent } from './events'

export abstract class HitTestable {
  /**
   * 碰撞
   * @param result 
   * @param position 
   */
  abstract hitTest (result: HitTestResult, position: Offset): void
}

export abstract class HitTestDispatcher {
  abstract dispatchEvent (event: PointerEvent, result: HitTestResult): void
}

export abstract class HitTestTarget {
  abstract handleEvent (event: AtPointerEvent, entry: HitTestEntry): void
}

export class HitTestEntry {
  static create (...rests: unknown[])
  static create (target: HitTestTarget, ...rests: unknown[]) {
    return new HitTestEntry(target, ...rests)
  }

  public target: HitTestTarget
  public transform: Matrix4 | null = null
  
  constructor (...rests: unknown[])
  constructor (target: HitTestTarget) {
    this.target = target
  }

  toString () {
    return `HitTestEntry(target: ${this.target})`
  }
}

export abstract class TransformPart {
  abstract multiply (rhs: Matrix4): Matrix4
}

export class MatrixTransformPart extends TransformPart {
  public matrix: Matrix4

  constructor (matrix: Matrix4) {
    super()
    this.matrix = matrix
  }

  multiply (rhs: Matrix4): Matrix4 {
    this.matrix.multiply(rhs)
    return this.matrix
  }
}

export class OffsetTransformPart extends TransformPart {
  public offset: Offset

  constructor (offset: Offset) {
    super()

    this.offset = offset
  }

  multiply (rhs: Matrix4): Matrix4 {
    const cloned = rhs.clone()
    cloned.leftTranslate(this.offset.dx, this.offset.dy)
    return cloned
  }
}

export type HitTestResultOptions = {
  path?: HitTestEntry[],
  transforms?: Matrix4[],
  localTransforms?: AtTransformPart[]
}

export class HitTestResult {
  static create (options?: HitTestResultOptions) {
    return new HitTestResult(
      options?.path,
      options?.transforms,
      options?.localTransforms
    )
  }

  static wrap (result: HitTestResult ) {
    return new HitTestResult(
      result.path, 
      result.transforms, 
      result.localTransforms
    )
  }

  private get lastTransform (): Matrix4 {
    this.globalizeTransforms()
    invariant(this.localTransforms.length === 0, ``)
    return this.transforms[this.transforms.length - 1]
  }

  public path: HitTestEntry[]
  public transforms: Matrix4[]
  public localTransforms: AtTransformPart[]

  constructor (
    path: HitTestEntry[] = [],
    transforms: Matrix4[] = [Matrix4.identity()],
    localTransforms: AtTransformPart[] = [],
  ) {
    this.path = path
    this.transforms = transforms
    this.localTransforms = localTransforms
  }

  globalizeTransforms () {
    if (this.localTransforms.length > 0) {
      let last: Matrix4 = this.transforms[this.transforms.length - 1]

      for (const part of this.localTransforms) {
        last = part.multiply(last)
        this.transforms.push(last)
      }
      this.localTransforms = []
    }
  }

  add (entry: HitTestEntry) {
    invariant(entry.transform === null)
    entry.transform = this.lastTransform
    this.path.push(entry)
  }

  pushTransform (transform: Matrix4): void {
    invariant(transform != null);
    
    this.localTransforms.push(new MatrixTransformPart(transform))
  }

  pushOffset (offset: Offset) {
    invariant(offset !== null, 'The argument "offset" cannot be null.')
    this.localTransforms.push(new OffsetTransformPart(offset))
  }

  popTransform () {
    // @TO BE CONFIRM
    if (this.localTransforms.length > 0) {
      this.localTransforms.pop()
    } else {
      this.localTransforms.pop()
    }
  }

  toString () {
    return `HitTestResult(${this.path.length === 0 ? '<empty path>' : this.path.join(',')})`
  }
}
