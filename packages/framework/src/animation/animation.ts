/*
 * @author: aniwei aniwei.studio@gmail.com
 * @date: 2022-12-12 23:47:56
 */
import { Subscribable } from '../basic/subscribable'
import { AtAnimatable } from './tween'


export enum AnimationStatus {
  Dismissed,
  Forward,
  Reverse,
  Completed
}

export type AnimationStatusSubscriber = (status: AnimationStatus) => void

export class AtAnimationStatusSubscribable extends Subscribable<AnimationStatusSubscriber> {
  private statusSubscribers: Subscribable<AnimationStatusSubscriber> = new Subscribable<AnimationStatusSubscriber>()


  subscribeStatusChange (subscriber: AnimationStatusSubscriber, context?: unknown) {
    this.statusSubscribers.subscribe(subscriber, context)
  }

  
  unsubscribeStatusChange (subscriber?: AnimationStatusSubscriber, context?: unknown) {
    this.statusSubscribers.unsubscribe(subscriber, context)
  }

  clearStatusSubscribers () {
    this.statusSubscribers.clear()
  }

  publishStatusChange (status: AnimationStatus) {
    this.statusSubscribers.publish(status)
  }
}




export abstract class AtAnimation<T> extends AtAnimationStatusSubscribable {
  abstract value: T | null
  abstract status: AnimationStatus

  public get isDismissed () {
    return this.status === AnimationStatus.Dismissed
  }
  
  public get isCompleted (): boolean {
    return this.status == AnimationStatus.Completed
  }

  drive (child: AtAnimatable<T>): AtAnimation<T> {
    return child.animate(this as AtAnimation<T>)
  }
}
