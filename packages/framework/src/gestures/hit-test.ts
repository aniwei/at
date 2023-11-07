/*
 * @author: aniwei aniwei.studio@gmail.com
 * @date: 2022-10-30 14:29:58
 */
import { invariant } from '@at/utility'
import { Offset } from '../basic/geometry'
import { Matrix4 } from '../basic/matrix4'

import type { AtPointerEvent } from './events'


export abstract class AtHitTestable {
  abstract hitTest (result: AtHitTestResult, position: Offset): void
}

export abstract class AtHitTestDispatcher {
  abstract dispatchEvent (event: PointerEvent, result: AtHitTestResult): void
}

export abstract class AtHitTestTarget {
  abstract handleEvent (event: AtPointerEvent, entry: AtHitTestEntry): void
}

export class AtHitTestEntry {
  static create (target: AtHitTestTarget, ...rest: unknown[]) {
    return new AtHitTestEntry(target)
  }

  public target: AtHitTestTarget
  public transform: Matrix4 | null = null
  
  constructor (target: AtHitTestTarget) {
    this.target = target
  }

  toString () {
    return `AtHitTestEntry(target: ${this.target})`
  }
}

export abstract class AtTransformPart {
  abstract multiply (rhs: Matrix4): Matrix4
}

export class AtMatrixTransformPart extends AtTransformPart {
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

export class AtOffsetTransformPart extends AtTransformPart {
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

export type AtHitTestResultOptions = {
  path?: AtHitTestEntry[],
  transforms?: Matrix4[],
  localTransforms?: AtTransformPart[]
}

export class AtHitTestResult {
  static create (options?: AtHitTestResultOptions) {
    return new AtHitTestResult(
      options?.path,
      options?.transforms,
      options?.localTransforms
    )
  }

  static wrap (result: AtHitTestResult ) {
    return new AtHitTestResult(
      result.path, 
      result.transforms, 
      result.localTransforms
    )
  }

  constructor (
    path: AtHitTestEntry[] = [],
    transforms: Matrix4[] = [Matrix4.identity()],
    localTransforms: AtTransformPart[] = [],
  ) {
    this.path = path
    this.transforms = transforms
    this.localTransforms = localTransforms
  }

  public path: AtHitTestEntry[]
  public transforms: Matrix4[]
  public localTransforms: AtTransformPart[]

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

  private get lastTransform (): Matrix4 {
    this.globalizeTransforms()
    invariant(this.localTransforms.length === 0, ``)
    return this.transforms[this.transforms.length - 1]
  }

  add (entry: AtHitTestEntry) {
    invariant(entry.transform === null)
    entry.transform = this.lastTransform
    this.path.push(entry)
  }

  pushTransform (transform: Matrix4): void {
    invariant(transform != null);
    
    this.localTransforms.push(new AtMatrixTransformPart(transform))
  }

  pushOffset (offset: Offset) {
    invariant(offset !== null, `The argument offset cannot be null.`)
    this.localTransforms.push(new AtOffsetTransformPart(offset))
  }

  popTransform () {
    // TO CONFIRM
    if (this.localTransforms.length > 0) {
      this.localTransforms.pop()
    } else {
      this.localTransforms.pop()
    }
  }

  toString () {
    return `AtHitTestResult(${this.path.length === 0 ? '<empty path>' : this.path.join(',')})`
  }
}
