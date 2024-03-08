import { StateMachine, StateMachineLifecycle, StateMachineOptions } from '../lib/state-machine'
import { Transition } from '../lib/transition'


enum WorkstationStateTransition {
  Init = 'init',
  Loading = 'Loading'
}

class WorkstationStateMachine extends StateMachine {
  static create <T = WorkstationStateMachine> (
    state: WorkstationStateTransition,
    transitions: Transition[],
    options?: StateMachineOptions
  ) {
    return super.create(state, transitions, options) as T
  }
}


const fsm = WorkstationStateMachine.create(WorkstationStateTransition.Init, [
  { name: 'start', from: WorkstationStateTransition.Init, to: WorkstationStateTransition.Loading }
])

fsm.is(WorkstationStateTransition.Init)

fsm.subscribe((lifecycle: StateMachineLifecycle, transition: Transition): Promise<void> | undefined => {
  if (lifecycle === StateMachineLifecycle.EnterState) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 5000)
    })
  }
})

await fsm.change({
  name: 'start', 
  from: WorkstationStateTransition.Init,
  to: WorkstationStateTransition.Loading
})

console.log(fsm.is(WorkstationStateTransition.Loading))

