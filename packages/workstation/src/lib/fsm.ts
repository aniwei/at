import * as FSM from '@at/fsm'
import transition from './transitions.json'

export enum StateMachineKind {
  None = 'none',
  Ready = 'ready'
}

export class StateMachine extends FSM.StateMachine {
  static create <T = StateMachine> (
    state: string, 
    options: FSM.StateMachineOptions
  ): T {
    return super.create(state, transition, options)
  }
}

