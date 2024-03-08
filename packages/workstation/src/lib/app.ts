import { AtBoot } from '@at/core'
import { Element } from '@at/document'
import { StateMachine, StateMachineKind } from './fsm'

export class App extends AtBoot {
  protected fsm: StateMachine = StateMachine.create(StateMachineKind.None, {
    wildcard: '*'
  })

  prepare (): Promise<void> {
    return Promise.all([
      super.prepare()
    ]).then(() => void 0)
  }

  start (callback?: VoidFunction) {
    return super.start(() => {
      this.document.on('ready', (root: Element) => {
        
      })

      callback?.()
    })
  }
}
