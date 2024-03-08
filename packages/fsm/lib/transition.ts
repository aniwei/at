//// => Transtion
export interface Transition {
  name: string,
  from: string[] | string,
  to: string
}

//// => TransitionsManager 
export class TransitionsManager {
  static create (wildcard: string = '*') {
    return new TransitionsManager(wildcard)
  }

  protected wildcard: string

  public states: string[] = []
  public transtions: Map<string, Map<string,Transition>> = new Map()

  constructor (wildcard: string) {
    this.wildcard = wildcard
  }

  add (state: string, transtion: Transition) {
    const name = transtion.name      

    if (!this.transtions.has(state)) {
      this.transtions.set(state, new Map())
    }
    
    const transitions = this.transtions.get(state) as Map<string, Transition>
    transitions.set(name, transtion)
  }

  seek (state: string, transition: Transition, ...rests: unknown[]) {
    const entry = this.transitionFor(state, transition)
    const to = entry?.to ?? null

    if (typeof to === 'function') {
      return Reflect.apply(to, this, rests)
    }

    return to
  }

  transitionFor (state: string, transition: Transition) {
    const wildcard = this.wildcard
    const transitions = this.transtions.get(state) ?? this.transtions.get(wildcard) as Map<string, Transition>
    return transitions.get(transition.name) ?? null
  }
}
