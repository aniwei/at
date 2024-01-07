import { Matrix4 } from '@at/math'
import { invariant, listEquals } from '@at/utils'
import { Equalable } from '@at/basic'
import { Rect, RRect } from '@at/geometry'

import { Path } from './path'

export enum MutatorKind {
  ClipRect,
  ClipRRect,
  ClipPath,
  Transform,
  Opacity,
}

//// => Mutator
// 变更
export interface MutatorOptions {
  kind: MutatorKind,
  rect?: Rect | null,
  rrect?: RRect | null,
  path?: Path | null,
  matrix?: Matrix4 | null,
  alpha?: number | null,
}

export class Mutator extends Equalable<Mutator> {
  static create (options: MutatorOptions) {
    return new Mutator(
      options.kind,
      options.rect,
      options.rrect,
      options.path,
      options.matrix,
      options.alpha,
    )
  }

  // => 类型
  public kind: MutatorKind 
  // => 路径
  public path: Path | null
  // => 矩形
  public rect: Rect | null
  // => 圆角矩形
  public rrect: RRect | null
  // => 矩阵
  public matrix: Matrix4 | null
  public alpha: number | null

  constructor (
    kind: MutatorKind,
    rect: Rect | null = null,
    rrect: RRect | null = null,
    path: Path | null = null,
    matrix: Matrix4 | null = null,
    alpha: number | null = null,
  ) {
    super()
    
    this.kind = kind
    this.rect = rect
    this.rrect = rrect
    this.path = path
    this.matrix = matrix
    this.alpha = alpha
  }

  /**
   * @param {Rect} rect
   * @return {Mutator}
   */  
  static clipRect (rect: Rect ) {
    return Mutator.create({
      kind: MutatorKind.ClipRect, 
      rect
    })
  }

  /**
   * @param {RRect} rrect
   * @return {Mutator}
   */  
  static clipRRect (rrect: RRect) {
    return Mutator.create({
      kind: MutatorKind.ClipRRect, 
      rrect
    })
  }

  /**
   * @param {Path} path
   * @return {Mutator}
   */  
  static clipPath (path: Path) {
    return Mutator.create({
      kind: MutatorKind.ClipPath, 
      path,
    })
  }

  /**
   * @param {Matrix4} matrix
   * @return {Mutator}
   */  
  static transform (matrix: Matrix4) {
    return Mutator.create({
      kind: MutatorKind.Transform, 
      matrix
    })
  }
  
  /**
   * @param {number} alpha
   * @return {*}
   */  
  static opacity (alpha: number) {
    return Mutator.create({
      kind: MutatorKind.Opacity, 
      alpha
    })
  }

  // => isClip
  public get isClip (): boolean {
    return (
      this.kind === MutatorKind.ClipRect ||
      this.kind === MutatorKind.ClipRRect ||
      this.kind === MutatorKind.ClipPath
    )
  }

  // => alphaFloat
  public get alphaFloat (): number {
    return this.alpha! / 255.0
  }

  /**
   * 是否相等
   * @param {Mutator | null} other 
   * @returns {boolean}
   */
  equal (other: Mutator | null): boolean {
    return (
      other instanceof Mutator && (
        !!other.rect?.equal(this.rect ?? null) ||
        !!other.rrect?.equal(this.rrect ?? null)
      )
    )
  }

  /**
   * 是否相等
   * @param {Mutator | null} other 
   * @returns {boolean}
   */
  notEqual (other: Mutator | null): boolean {
    return !this.equal(other)
  }
}

//// => Mutators
// 变更集合
export class MutatorsManager extends Equalable<MutatorsManager> {
  static create () {
    return new MutatorsManager()
  }

  /**
   * @param {Mutators} original
   * @return {Mutators}
   */  
  static copy (origin: MutatorsManager) {
    const m = MutatorsManager.create()
    
    for (const mut of origin.mutators) {
      m.mutators.push(mut)
    }
    
    return m
  }

  // => cullRect
  // 获取绘制范围
  public get cullRect () {
    let cullRect = Rect.LARGEST
    for (const mutator of this.mutators) {
      let rect: Rect = Rect.ZERO

      switch (mutator.kind) {
        case MutatorKind.ClipRect:
          invariant(mutator.rect)
          rect = mutator.rect
          break

        case MutatorKind.ClipRRect:
          invariant(mutator.rrect)
          rect = mutator.rrect.outer
          break

        case MutatorKind.ClipPath:
          invariant(mutator.path)
          rect = mutator.path.getBounds()
          break
      }

      cullRect = cullRect.intersect(rect)
    }
      
    return cullRect
  }

  public mutators: Mutator[] = []

  /**
   * @param {Rect} rect
   */  
  pushClipRect (rect: Rect) {
    this.mutators.push(Mutator.clipRect(rect))
  }

  /**
   * @param {RRect} rrect
   */  
  pushClipRRect (rrect: RRect) {
    this.mutators.push(Mutator.clipRRect(rrect))
  }

  /**
   * @param {Path} path
   */  
  pushClipPath (path: Path) {
    this.mutators.push(Mutator.clipPath(path))
  }

  /**
   * @param {Matrix4} matrix
   */  
  pushTransform (matrix: Matrix4) {
    this.mutators.push(Mutator.transform(matrix))
  }

  /**
   * @param {number} alpha
   */  
  pushOpacity (alpha: number) {
    this.mutators.push(Mutator.opacity(alpha))
  }

  pop () {
    return this.mutators.pop()
  }
  
  /**
   * 是否相等
   * @param {Mutators} other
   * @return {boolean}
   */  
  equal (other: MutatorsManager | null) {
    return (
      other instanceof MutatorsManager &&
      listEquals<Mutator>(other.mutators, this.mutators)
    )
  }

  /**
   * 是否相等
   * @param {Mutators} other
   * @return {boolean}
   */  
  notEqual (other: MutatorsManager | null) {
    return !this.equal(other)
  }
}

//// => ViewListDiffResult
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
