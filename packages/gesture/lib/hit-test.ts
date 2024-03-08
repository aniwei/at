import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { Matrix4 } from '@at/math'
import type { SanitizedPointerEvent } from './sanitizer'

//// => HitTestable
// 碰撞
export abstract class HitTestable {
  /**
   * 碰撞
   * @param result 
   * @param position 
   */
  abstract hitTest (result: HitTestResult, position: Offset): void
}

//// => HitTestDispatcher
// 碰撞分发
export abstract class HitTestDispatcher {
  abstract dispatchEvent (event: SanitizedPointerEvent, result: HitTestResult): void
}

//// => HitTestTarget
// 碰撞对象
export abstract class HitTestTarget {
  abstract handleEvent (event: SanitizedPointerEvent, entry: HitTestEntry): void
}

//// => HitTestEntry
// 碰撞入口
export class HitTestEntry {
  static create (...rests: unknown[]): HitTestEntry
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
    return `HitTestEntry(
      [target]: ${this.target}
    )`
  }
}

//// => TransformPart
// 矩阵
export abstract class TransformPart {
  abstract multiply (rhs: Matrix4): Matrix4
}

//// => MatrixTransformPart
// 矩阵
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

//// => OffsetTransformPart
export class OffsetTransformPart extends TransformPart {
  public offset: Offset

  constructor (offset: Offset) {
    super()

    this.offset = offset
  }

  multiply (rhs: Matrix4): Matrix4 {
    const cloned = rhs.clone()
    cloned.translate(this.offset.dx, this.offset.dy)
    return cloned
  }
}

//// => HitTestResult
// 碰撞结果
export type HitTestResultOptions = {
  path?: HitTestEntry[],
  transforms?: Matrix4[],
  localTransforms?: TransformPart[]
}


export interface HitTestResultFactory<T> {
  new (...rests: unknown[]) : T
  new (
    path: HitTestEntry[],
    transforms: Matrix4[],
    localTransforms: TransformPart[],
  ) : T
  create (...rests: unknown[]) : T
  create (options?: HitTestResultOptions): T
}
export class HitTestResult {
  static create <T extends HitTestResult> (...rests: unknown[]): HitTestResult
  static create <T extends HitTestResult> (options?: HitTestResultOptions) {
    const HitTestResultFactory = this as unknown as HitTestResultFactory<T>

    return new HitTestResultFactory(
      options?.path,
      options?.transforms,
      options?.localTransforms
    ) as HitTestResult
  }

  static wrap (result: HitTestResult ) {
    return new HitTestResult(
      result.path, 
      result.transforms, 
      result.localTransforms
    )
  }

  public get lastTransform (): Matrix4 {
    this.globalizeTransforms()
    invariant(this.localTransforms.length === 0, ``)
    return this.transforms[this.transforms.length - 1]
  }

  public path: HitTestEntry[]
  public transforms: Matrix4[]
  public localTransforms: TransformPart[]

  constructor (
    path: HitTestEntry[] = [],
    transforms: Matrix4[] = [Matrix4.identity()],
    localTransforms: TransformPart[] = [],
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
    if (this.localTransforms.length > 0) {
      this.localTransforms.pop()
    } else {
      this.localTransforms.pop()
    }
  }

  toString () {
    return `HitTestResult(
      ${this.path.length === 0 ? '<empty path>' : this.path.join(',')
    })`
  }
}
