import invariant from '@at/utils'
import { EventEmitter } from '@at/framework'


export type TranstionState = number
export type TransitonToCallback<T extends TranstionState> = (...parameters: unknown[]) => T
export type Transition<T extends TranstionState> = {
  name: string,
  from: T | T[],
  to: T | TransitonToCallback<T>
}

export type FSMEvents = `error` | `transitionstart` | `transitionend` | `transition` | `transitionchange`

export class FSM<T extends TranstionState> extends EventEmitter<FSMEvents> {
  static create <T extends TranstionState> (transitions: Transition<T>[]) {
    return new FSM(transitions)
  }

  // => state
  private _state: T | null = null
  public get state () {
    invariant(this._state !== null)
    return this._state
  }
  public set state (value: T) {
    this._state = value
  }

  public context: unknown
  public pending: boolean = false
  public wildcard: TranstionState | null = null
  public transitions: Map<Symbol, Transition<T>> = new Map()

  constructor (transitions: Transition<T>[], context?: unknown, wildcard?: T) {
    super()

    this.context = context
    this.wildcard = wildcard ?? null

    for (const transition of transitions) {
      const from: T[] = Array.isArray(transition.from) 
        ? transition.from 
        : [transition.from as T]
      
      for (const f of from) {
        const key = Symbol.for(`${f}.${transition.name}`)
        this.transitions.set(key, transition)
      }
    }

    this.context = context
  }

  is (state: T[] | T): boolean {
    return Array.isArray(state)
      ? state.includes(this.state)
      : this.state === state
  }

  can (transition: string): boolean {
    if (this.pending) {
      return false
    }

    return !!this.seek(transition)
  }

  cannot (transition: string): boolean {
    return this.can(transition)
  }

  async seek (transition: string, parameters?: unknown[]) {
    const wildcard = this.wildcard
    const to = this.transitionFor(this.state, transition)
    
    if (typeof to === 'function') {
      return Reflect.apply(to, this.context, parameters ?? [])
    } else if (to === wildcard) {
      return this.state
    } else {
      return to
    }
  }

  transitionFor (state: T, name: string) {
    const wildcard = this.wildcard
    const transtion = this.transitions.get(Symbol.for(`${state}.${name}`)) ?? null

    if (transtion !== null) {
      return transtion
    }

    return this.transitions.get(Symbol.for(`${wildcard}.${name}`)) ?? null
  }

  async transit (
    transition: string, 
    parameters: unknown[]
  ) {
    const from = this.state
    this.emit('transitionstart', transition, this.state)
    const to = await this.seek(transition)

    if (to === null) {
      return this.emit(`error`, new InvalidTransitionError())
    }

    if (this.pending) {
      return this.emit(`error`,  new TransitionExecuteError())
    }

    this.pending = true

    parameters.unshift({
      transition,
      from,
      to,
      context: this.context
    })

    this.state = to as T

    this.emit(`transitionend`, transition, this.state)
  }
}


export class InvalidTransitionError extends Error { }
export class TransitionExecuteError extends Error { }