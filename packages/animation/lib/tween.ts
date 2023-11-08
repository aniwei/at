import { invariant } from '@at/utils'
import { Color, subscribable } from '@at/basic'
import { Rect, Size } from '@at/geometry'
import { AnimationStatus, Animation } from './animation'
import { Curve } from './curves'


//// => Animatable
export type AnimatableCallback<T> = (t: T) => T

export abstract class Animatable<T> {
  static fromCallback <T> (callback: AnimatableCallback<T>) {
    return CallbackAnimatable.create(callback)
  }
  
  abstract transform (t: T | null): T | null
  
  evaluate (animation: Animation<T>): T | null {
    invariant(animation.value !== null)
    return this.transform(animation.value)
  }

  animate (parent: Animation<T>): Animation<T> {
    return AnimatedEvaluation.create<T>(parent, this)
  }

  chain (parent: Animatable<T>): Animatable<T> {
    return ChainedEvaluation.create<T>(parent, this)
  }
}

//// => CallbackAnimatable
export class CallbackAnimatable<T> extends Animatable<T> {
  static create<T>(callback: AnimatableCallback<T>) {
    return new CallbackAnimatable<T>(callback)
  }

  constructor (callback: AnimatableCallback<T>) {
    super()
    this.callback = callback
  }

  private callback: AnimatableCallback<T>

  transform (t: T): T | null {
    return this.callback(t)
  }
}

//// => AnimatedEvaluation
export class AnimatedEvaluation<T> extends Animation<T> {
  static create<T>(parent: Animation<T>, evaluatable: Animatable<T>) {
    return new AnimatedEvaluation(parent, evaluatable)
  }

  // => status
  public get status () {
    return this.parent.status
  }
  
  public parent: Animation<T>
  private evaluatable: Animatable<T>
  
  public get value (): T | null {
    return this.evaluatable.evaluate(this.parent)
  } 

  constructor (
    parent: Animation<T>, 
    evaluatable: Animatable<T>
  ) {
    super()

    this.parent = parent
    this.evaluatable = evaluatable
  }

  subscribe (handler: SubscribeHandle, context?: unknown) {
    this.parent.subscribe(handler, context) 
  }

  removeListener (handler?: SubscribeHandle | undefined, context?: unknown) {
    this.parent.unsubscribe(handler, context) 
  }

  subscribeStatusChange (listener: (status: AnimationStatus) => void): void {
    this.parent.subscribeStatusChange(listener)
  }
  unsubscribeStatusChange (listener: (status: AnimationStatus) => void): void {
    this.parent.unsubscribeStatusChange(listener)
  }
  
  toString () {
    return 'AnimatedEvaluation()'
  }

}

//// => ChainedEvaluation
export class ChainedEvaluation<T> extends Animatable<T> {
  static create<T>(parent: Animatable<T>, evaluatable: Animatable<T>) {
    return new ChainedEvaluation(parent, evaluatable)
  }

  private parent: Animatable<T>
  private evaluatable: Animatable<T>

  constructor (parent: Animatable<T>, evaluatable: Animatable<T>) {
    super()
    this.parent = parent
    this.evaluatable = evaluatable
  }

  transform (t: T): T | null {
    return this.evaluatable.transform(this.parent.transform(t))
  }

  toString () {
    return 'ChainedEvaluation()'
  }
}


//// => Tween
export abstract class Tween<T> extends Animatable<T> {
  public begin: T
  public end: T

  constructor (begin: T, end: T) {
    super()

    this.begin = begin
    this.end = end
  }

  abstract lerp (t: number): T | null

  
  transform (t: T): T | null{
    if (t === 0.0) {
      return this.begin as T
    }
    if (t === 1.0) {
      return this.end as T
    }
    return this.lerp(t as number)
  }

  toString () {
    return `Tween([begin]: ${this.begin}, [end]: ${this.end})`
  }
}

//// => ReverseTween
export abstract class ReverseTween<T> extends Tween<T> {
  constructor (parent: Tween<T>) {
    super(parent.end, parent.begin)
    this.parent = parent
  }

  public parent: Tween<T> 
}

//// => ColorTween
export class ColorTween extends Tween<Color> {
  static create<T>(begin: Color, end: Color) {
    return new ColorTween(begin, end)
  }

  constructor (begin: Color, end: Color) {
    super(begin, end)
  }

  lerp (t: number): Color | null {
    return Color.lerp(this.begin, this.end, t)
  }
}

//// => SizeTween
export class SizeTween extends Tween<Size> {  
  lerp (t: number) {
    return Size.lerp(this.begin, this.end, t)
  }
}

//// => RectTween
export class RectTween extends Tween<Rect> {
  lerp (t: number) {
    return Rect.lerp(this.begin, this.end, t)
  }
}

//// => IntTween
export class IntTween extends Tween<number> {  
  lerp (t: number) {
    return Math.round(this.begin + (this.end - this.begin) * t)
  }
}

//// => StepTween
export class StepTween extends Tween<number> {  
  lerp (t: number) {
    return Math.floor(this.begin + (this.end - this.begin) * t)
  } 
}

//// => CurveTween
export class CurveTween extends Animatable<number> {
  public curve: Curve

  constructor (curve: Curve) {
    super()
    this.curve = curve
  }

  transform (t: number) {
    if (t === 0.0 || t === 1.0) {
      return t
    }
    return this.curve.transform(t)
  }

  
  toString () {
    return `CurveTween([curve]: ${this.curve})`
  }
}
