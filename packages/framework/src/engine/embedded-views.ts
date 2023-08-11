import { Matrix4 } from '../basic/matrix4'
import { AtPath } from './path'
import { Offset, Rect, RRect, Size } from '../basic/geometry'
import { listEquals } from '../basic/helper'

export enum MutatorType {
  ClipRect,
  ClipRRect,
  ClipPath,
  Transform,
  Opacity,
}

export class EmbeddedViewParams {
  public offset: Offset
  public size: Size
  public mutators: Mutators

  constructor (
    offset: Offset, 
    size: Size, 
    mutators: Mutators
  ) {
    this.size = size
    this.offset = offset
    this.mutators = Mutators.copy(mutators)
  }

  equal (other: EmbeddedViewParams | null) {
    return (
      other instanceof EmbeddedViewParams &&
      other.offset.equal(this.offset) &&
      other.size.equal(this.size) &&
      other.mutators.equal(this.mutators)
    )
  }

  notEqual (other: EmbeddedViewParams | null) {
    return !this.equal(other)
  }
}


export class Mutator {
  public type: MutatorType 
  public rect: Rect | null
  public rrect: RRect | null
  public path: AtPath | null
  public matrix: Matrix4 | null
  public alpha: number | null

  /**
   * @description: 
   * @return {*}
   */  
  constructor (
    type: MutatorType,
    rect: Rect | null = null,
    rrect: RRect | null = null,
    path: AtPath | null = null,
    matrix: Matrix4 | null = null,
    alpha: number | null = null,
  ) {
    this.type = type
    this.rect = rect
    this.rrect = rrect
    this.path = path
    this.matrix = matrix
    this.alpha = alpha
  }

  /**
   * @description: 
   * @param {Rect} rect
   * @return {*}
   */  
  static clipRect (rect: Rect ) {
    return new Mutator(
      MutatorType.ClipRect, 
      rect
    )
  }

  /**
   * @description: 
   * @param {RRect} rrect
   * @return {*}
   */  
  static clipRRect (rrect: RRect) {
    return new Mutator(
      MutatorType.ClipRRect, 
      null, 
      rrect
    )
  }

  /**
   * @description: 
   * @param {AtPath} path
   * @return {*}
   */  
  static clipPath (path: AtPath) {
    return new Mutator(
      MutatorType.ClipPath, 
      null, 
      null, 
      path,
    )
  }

  /**
   * @description: 
   * @param {Matrix4} matrix
   * @return {*}
   */  
  static transform (matrix: Matrix4) {
    return new Mutator(
      MutatorType.Transform, 
      null, 
      null, 
      null, 
      matrix
    )
  }
  
  /**
   * @description: 
   * @param {number} alpha
   * @return {*}
   */  
  static opacity (alpha: number) {
    return new Mutator(
      MutatorType.Opacity, 
      null, 
      null, 
      null, 
      null, 
      alpha
    )
  }

  public get isClipType (): boolean {
    return (
      this.type === MutatorType.ClipRect ||
      this.type === MutatorType.ClipRRect ||
      this.type === MutatorType.ClipPath
    )
  }

  public get alphaFloat (): number {
    return this.alpha! / 255
  }

  equal (other: Mutator) {
    if (other === this) {
      return true
    }

    if (other instanceof Mutator) {
      if (this.rect && other.rect) {
        return this.rect.equal(other.rect)
      } else if (this.rrect && other.rrect) {
        return this.rrect.equal(other.rrect)
      }
    }

    return false
  }
}

export class Mutators extends Array<Mutator> {
  
  /**
   * @description: 
   * @param {Mutators} original
   * @return {*}
   */  
  static copy (original: Mutators) {
    const mutators = new Mutators()
    
    for (const mut of original) {
      mutators.push(mut)
    }
    
    return mutators
  }

  /**
   * @description: 
   * @param {Rect} rect
   * @return {*}
   */  
  pushClipRect (rect: Rect ) {
    this.push(Mutator.clipRect(rect))
  }

  /**
   * @description: 
   * @param {RRect} rrect
   * @return {*}
   */  
  pushClipRRect (rrect: RRect) {
    this.push(Mutator.clipRRect(rrect))
  }

  /**
   * @description: 
   * @param {AtPath} path
   * @return {*}
   */  
  pushClipPath (path: AtPath) {
    this.push(Mutator.clipPath(path))
  }

  /**
   * @description: 
   * @param {Matrix4} matrix
   * @return {*}
   */  
  pushTransform (matrix: Matrix4) {
    this.push(Mutator.transform(matrix))
  }

  /**
   * @description: 
   * @param {number} alpha
   * @return {*}
   */  
  pushOpacity (alpha: number) {
    this.push(Mutator.opacity(alpha))
  }

  /**
   * @description: 
   * @param {Mutators} other
   * @return {*}
   */  
  equal (other: Mutators | null) {
    return (
      other instanceof Mutators &&
      listEquals<Mutator>(other, this)
    )
  }
}


export class ViewListDiffResult {
  public viewsToRemove: number[]
  public viewsToAdd: number[]
  public addToBeginning: boolean
  public viewToInsertBefore: number | null

  /**
   * @description: 
   * @return {ViewListDiffResult}
   */  
  constructor (
    viewsToRemove: number[], 
    viewsToAdd: number[], 
    addToBeginning: boolean,
    viewToInsertBefore?: number | null
  ) {
    this.viewsToRemove = viewsToRemove
    this.viewsToAdd = viewsToAdd
    this.addToBeginning = addToBeginning
    this.viewToInsertBefore = viewToInsertBefore ?? null
  }
}



/**
 * @description: 
 * @param {number} active
 * @param {number} next
 * @return {*}
 */
export function diffViewList (
  active: number[], 
  next: number[]
): ViewListDiffResult | null {
  if (
    active.length === 0 || 
    next.length === 0
  ) {
    return null
  }
  
  let index = active.indexOf(next[0])
  if (index !== -1) {
    for (let i = 0; i + index < active.length; i++) {
      if (active[i + index] != next[i]) {
        return null
      }

      if (i === next.length - 1) {
        if (index === 0) {
          return new ViewListDiffResult(
            active.slice(i + 1), 
            [], 
            true,
            next[0]
          )
        } else {
          return new ViewListDiffResult(
            active.slice(0, index), 
            [], 
            false
          )
        }
      }
    }

    return new ViewListDiffResult(
      active.slice(0, index),
      next.slice(active.length - index),
      false,
    )
  }

  index = active.lastIndexOf(next[next.length - 1])
  if (index != -1) {
    for (let i = 0; index - i >= 0; i++) {
      if (
        next.length <= i || 
        active[index - i] !== 
        next[next.length - 1 - i]
      ) {
        return null
      }
    }

    return new ViewListDiffResult(
      active.slice(index + 1),
      next.slice(0, next.length - index - 1),
      true,
      active[0],
    )
  }

  return null
}
