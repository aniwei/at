import { Subscribable } from '@at/basic'
import { invariant, isArray } from '@at/utils'
import { Transition, TransitionsManager } from './transition'
import { TransitionError } from './transition-error'


//// => StateMachine
export enum StateMachineLifecycle {
  BeforeTransition = 'beforetransition',
  AfterTransition = 'aftertransition',
  EnterState = 'enterstate',
  LeaveState = 'leavestate',
  TransitionChange = 'transitionchange',
}

export interface StateMachineOptions {
  wildcard: string
}

export interface StateMachineFactory <T> {
  create <T> (...rests: unknown[]) : T
  create <T> (
    state: string, 
    transitions: Transition[],
    options: StateMachineOptions
  ): T
  new (...rests: unknown[]): T
  new (
    state: string, 
    transitions: Transition[],
    options: StateMachineOptions
  ): T
}
export abstract class StateMachine extends Subscribable {
  static WILD_CARD = '*'

  static create <T> (...rests: unknown[]): T
  static create <T> (
    state: string, 
    transitions: Transition[],
    options: StateMachineOptions
  ) {
    const StateMachineFactory = this as unknown as StateMachineFactory<T>
    return new StateMachineFactory(state, transitions, options)
  }

  // => state
  protected _state: string | null = null
  public get state () {
    invariant(this._state !== null, 'The "StateMachine.state" cannot be null.')
    return this._state
  }
  public set state (state: string) {
    if (this._state === null) {
      this._state = state
    } else if (this._state !== state) {
      if (this.pendding === null) {
        throw new TransitionError('Transition is invalid while previous transition is still in progress.')
      }

      this._state = state
    }
  }

  protected pendding: Transition | null = null
  
  public states: string[]
  public transtions: TransitionsManager
  

  constructor (
    state: string, 
    transitions: Transition[], 
    options: StateMachineOptions = {
      wildcard: '*'
    }
  ) {
    super()

    this.states = []
    this.state = state
    this.transtions = TransitionsManager.create(options.wildcard)

    const addState = (state: string) => {
      if (!this.states.includes(state)) {
        this.states.push(state)
      }
    }

    for (const transition of transitions) {
      const states = (isArray(transition.from) 
        ? transition.from 
        : [transition.from]) as string[]

      const to = transition.to ?? StateMachine.WILD_CARD

      if (typeof to !== 'function') {
        addState(to)
      }

      for (const state of states) {
        addState(state)
        this.transtions.add(state, transition)
      }
        
    }
  }

  /**
   * 是否包含当前状态
   * @param {string | string[]} states 
   * @returns {boolean}
   */
  is (states: string) {
    return Array.isArray(states) 
      ? states.indexOf(this.state) >= 0 
      : (this.state === states)
  }

  /**
   * 是否可以变更状态
   * @param {Transition} transition 
   * @returns 
   */
  can (transition: Transition) {
    return this.pendding 
      ? false
      : this.seek(transition)
  }

  /**
   * 是否不可以变更状态
   * @param {Transition} transition 
   * @returns 
   */
  cannot (transition: Transition) {
    return !this.can(transition)
  }

  /**
   * 查找 Transition
   * @param {Transition} transition 
   * @param {...unknown[]} rests 
   * @returns 
   */
  seek (
    transition: Transition, 
    ...rests: unknown[]
  ) {
    return this.transtions.seek(this.state, transition, ...rests)
  }

  /**
   * 变更到
   * @param {string} state 
   * @param {Transition} transition 
   * @returns {null | Transition}
   */
  transitionFor (state: string, transition: Transition) {
    return this.transtions.transitionFor(state, transition)
  }

  async change (
    transition: Transition,
    ...rests: unknown[]
  ) {
    invariant(transition.to, 'The argument "to" cannot be null.')

    if (this.pendding) {
      throw new TransitionError('Transition is invalid while previous transition is still in progress.')
    }

    const changed = transition.from !== transition.to
    this.pendding = transition

    try {
      // before
      await this.publish(
        StateMachineLifecycle.BeforeTransition, 
        this.pendding, 
        ...rests
      )
  
      // leave
      if (changed) {
        await this.publish(
          StateMachineLifecycle.LeaveState, 
          this.pendding, 
          ...rests
        )
      }
  
      // set state
      this.state = transition.to
  
      // enter
      if (changed) {
        await this.publish(
          StateMachineLifecycle.EnterState, 
          this.pendding, 
          ...rests
        )
      }
  
      if (changed) {
        await this.publish(
          StateMachineLifecycle.TransitionChange, 
          this.pendding, 
          ...rests
        )
      }

      await this.publish(
        StateMachineLifecycle.AfterTransition, 
        this.pendding, 
        ...rests
      )

      this.pendding = null
    } catch (error: any) {
      throw error
    }
  }
}