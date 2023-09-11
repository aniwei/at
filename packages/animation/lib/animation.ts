import { Subscribable } from '@at/basic'
import { Animatable } from './tween'


//// => AnimationStatusSubscribable
export enum AnimationStatusKind {
  Dismissed,
  Forward,
  Reverse,
  Completed
}

export type AnimationStatusSubscriber = (status: AnimationStatusKind) => void
export class AnimationStatusSubscribable extends Subscribable<AnimationStatusSubscriber> {
}

//// => Animation
export interface AnimationFactory {
  create (...rests: unknown[])
  new (...rests: unknown[])
}
export abstract class Animation<T> extends AnimationStatusSubscribable {
  static create (...rests: unknown[]) {
    const AnimationFactory = this as unknown as AnimationFactory
    return new AnimationFactory(...rests)
  }

  public get dismissed () {
    return this.status === AnimationStatusKind.Dismissed
  }
  
  public get completed (): boolean {
    return this.status === AnimationStatusKind.Completed
  }

  abstract value: T | null
  abstract status: AnimationStatusKind

  constructor (...rests: unknown[]) {
    super()
  }

  /**
   * 
   * @param {Animatable<T>} child 
   * @returns {Animatable<T>}
   */
  drive (child: Animatable<T>): Animation<T> {
    return child.animate(this as Animation<T>)
  }
}
