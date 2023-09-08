import { invariant } from 'ts-invariant'
import { Color, Rect, Size } from '../at'
import { AnimationStatus, AtAnimation } from './animation'
import { SubscribeHandle } from '../basic/subscribable'
import { AtCurve } from './curves'

type AnimatableCallback<T> = (t: T) => T

export abstract class AtAnimatable<T> {
  static fromCallback <T> (callback: AnimatableCallback<T>) {
    return AtCallbackAnimatable.create(callback)
  }
  
  abstract transform (t: T | null): T | null
  
  evaluate (animation: AtAnimation<T>): T | null {
    invariant(animation.value !== null)
    return this.transform(animation.value)
  }

  animate (parent: AtAnimation<T>): AtAnimation<T> {
    return AtAnimatedEvaluation.create<T>(parent, this)
  }

  chain (parent: AtAnimatable<T>): AtAnimatable<T> {
    return AtChainedEvaluation.create<T>(parent, this)
  }
}

export class AtCallbackAnimatable<T> extends AtAnimatable<T> {
  static create<T>(callback: AnimatableCallback<T>) {
    return new AtCallbackAnimatable<T>(callback)
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

export class AtAnimatedEvaluation<T> extends AtAnimation<T> {
  static create<T>(parent: AtAnimation<T>, evaluatable: AtAnimatable<T>) {
    return new AtAnimatedEvaluation(parent, evaluatable)
  }

  public get status () {
    return this.parent.status
  }
  
  public parent: AtAnimation<T>
  private evaluatable: AtAnimatable<T>


  
  public get value (): T | null {
    return this.evaluatable.evaluate(this.parent)
  } 

  constructor (parent: AtAnimation<T>, evaluatable: AtAnimatable<T>) {
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
    return `AtAnimatedEvaluation()`
  }

}

export class AtChainedEvaluation<T> extends AtAnimatable<T> {
  static create<T>(parent: AtAnimatable<T>, evaluatable: AtAnimatable<T>) {
    return new AtChainedEvaluation(parent, evaluatable)
  }

  constructor (parent: AtAnimatable<T>, evaluatable: AtAnimatable<T>) {
    super()
    this.parent = parent
    this.evaluatable = evaluatable
  }

  private parent: AtAnimatable<T>
  private evaluatable: AtAnimatable<T>

  
  transform (t: T): T | null {
    return this.evaluatable.transform(this.parent.transform(t))
  }


  toString () {
    return `AtChainedEvaluation()`
  }
}

export abstract class AtTween<T> extends AtAnimatable<T> {
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
    return `AtTween()`
  }
}


export abstract class AtReverseTween<T> extends AtTween<T> {
  constructor (parent: AtTween<T>) {
    super(parent.end, parent.begin)
    this.parent = parent
  }

  public parent: AtTween<T> 
}

export class AtColorTween extends AtTween<Color> {
  static create<T>(begin: Color, end: Color) {
    return new AtColorTween(begin, end)
  }

  constructor (begin: Color, end: Color) {
    super(begin, end)
  }

  lerp (t: number): Color | null {
    return Color.lerp(this.begin, this.end, t)
  }
}

export class AtSizeTween extends AtTween<Size> {  
  lerp (t: number) {
    return Size.lerp(this.begin, this.end, t)
  }
}

export class AtRectTween extends AtTween<Rect> {
  lerp (t: number) {
    return Rect.lerp(this.begin, this.end, t)
  }
}

export class AtIntTween extends AtTween<number> {  
  lerp (t: number) {
    return Math.round(this.begin + (this.end - this.begin) * t)
  }
}


export class AtStepTween extends AtTween<number> {  
  lerp (t: number) {
    return Math.floor(this.begin + (this.end - this.begin) * t)
  } 
}

export class AtCurveTween extends AtAnimatable<number> {
  public curve: AtCurve

  constructor (curve: AtCurve) {
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
    return `AtCurveTween()`
  }
}
