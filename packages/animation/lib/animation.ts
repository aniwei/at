import { Subscribable } from '@at/basic'
import { Animatable } from './tween'


//// => AnimationStateKind
// 动画状态
export enum AnimationStateKind {
  Dismissed,
  Forward,
  Reverse,
  Completed
}

export interface AnimationStateSubscriber {
  (status: AnimationStateKind): void
}

export class AnimationStateSubscribable extends Subscribable<AnimationStateSubscriber> { }

//// => Animation
export interface AnimationFactory<T> {
  create (...rests: unknown[]): T
  new (...rests: unknown[]): T
}
export abstract class Animation<T> extends AnimationStateSubscribable {
  static create <T> (...rests: unknown[]) {
    const AnimationFactory = this as unknown as AnimationFactory<T>
    return new AnimationFactory(...rests) as T
  }

  // => dismissed
  public get dismissed () {
    return this.state === AnimationStateKind.Dismissed
  }

  // => completed
  public get completed (): boolean {
    return this.state === AnimationStateKind.Completed
  }

  // 数值
  abstract value: T | null
  // 状态
  abstract state: AnimationStateKind
  
  /**
   * 
   * @param {Animatable<T>} child 
   * @returns {Animatable<T>}
   */
  drive (child: Animatable<T>): Animation<T> {
    return child.animate(this as Animation<T>)
  }
}
