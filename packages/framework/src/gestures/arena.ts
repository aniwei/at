import { At } from '../at'
import invariant from 'ts-invariant'


export enum GestureDisposition {
  Accepted,
  Rejected,
}

export abstract class AtGestureArenaMember {
  abstract accept (pointer: number): void
  abstract reject (pointer: number): void
}

export type AtGestureArenaEntryOptions = {
  arena: AtGestureArenaManager,
  pointer: number,
  member: AtGestureArenaMember,
}

export class AtGestureArenaEntry {
  static create (options: AtGestureArenaEntryOptions) {
    return new AtGestureArenaEntry(
      options.arena,
      options.pointer,
      options.member,
    )
  }

  public arena: AtGestureArenaManager 
  public member: AtGestureArenaMember
  
  private pointer: number

  /**
   * 
   * @param {AtGestureArenaManager} arena 
   * @param {number} pointer 
   * @param {AtGestureArenaMember} member 
   */
  constructor (
    arena: AtGestureArenaManager,
    pointer: number,
    member: AtGestureArenaMember,
  ) {
    this.arena = arena
    this.pointer = pointer
    this.member = member
  }

  resolve (disposition: GestureDisposition) {
    // console.log(this.pointer, this.arena)
    this.arena.resolve(this.pointer, this.member, disposition)
  }
}

export class AtGestureArena {
  public members: AtGestureArenaMember[] = []
  public isOpen: boolean = true
  public isHeld: boolean = false
  public hasPendingSweep: boolean = false

  public eagerWinner: AtGestureArenaMember | null = null

  add (member: AtGestureArenaMember) {
    invariant(this.isOpen)
    this.members.push(member)
  }

  toString () {
    return `AtGestureArena(members: ${this.members.length})`
  }
}

export class AtGestureArenaManager {
  private arenas: Map<number, AtGestureArena> = new Map<number, AtGestureArena>()

  add (pointer: number, member: AtGestureArenaMember): AtGestureArenaEntry {
    if (!this.arenas.has(pointer)) {
      this.arenas.set(pointer, new AtGestureArena())
    }

    const state = this.arenas.get(pointer) as AtGestureArena
    state.add(member)

    return AtGestureArenaEntry.create({ 
      arena: this, 
      pointer, 
      member 
    })
  }

 close (pointer: number) {
    const state: AtGestureArena | null = this.arenas.get(pointer) ?? null
    if (state !== null) {
      state.isOpen = false
      this.tryToResolveArena(pointer, state)
    }
  }

  sweep (pointer: number) {
    const state: AtGestureArena | null = this.arenas.get(pointer) ?? null
    
    if (state !== null) {
      invariant(!state.isOpen)
      if (state.isHeld) {
        state.hasPendingSweep = true
        return
      }
      console.log(`sweep`)
      this.arenas.delete(pointer)
      if (state.members.length > 0) {
        const member = state.members[0]
        member.accept(pointer)
      
        for (let i = 1; i < state.members.length; i++) {
          state.members[i].reject(pointer)
        }
      }
    }
  }

  
  hold (pointer: number) {
    const state: AtGestureArena | null = this.arenas.get(pointer) ?? null
    if (state !== null) {
      state.isHeld = true;
    }
  }

  release (pointer: number) {
    const state: AtGestureArena | null = this.arenas.get(pointer) ?? null
    if (state !== null) {
      state.isHeld = false
      if (state.hasPendingSweep) {
        this.sweep(pointer)
      }
    }
      
  }

  resolve (pointer: number, member: AtGestureArenaMember, disposition: GestureDisposition) {
    const state: AtGestureArena | null = this.arenas.get(pointer) ?? null
    
    if (state !== null) {
      if (disposition == GestureDisposition.Rejected) {
        const index = state.members.indexOf(member)
        if (index > -1) {
          invariant(state.members.includes(member))
          state.members.splice(index, 1)
        }
        member.reject(pointer)
        if (!state.isOpen) {
          this.tryToResolveArena(pointer, state)
        }
      } else {
        invariant(disposition === GestureDisposition.Accepted)
        if (state.isOpen) {
          state.eagerWinner ??= member
        } else {
          this.resolveInFavorOf(pointer, state, member)
        }
      }
    }
  
  
  }

  private tryToResolveArena (pointer: number, state: AtGestureArena) {
    invariant(this.arenas.get(pointer) === state)
    invariant(!state.isOpen)
    if (state.members.length == 1) {
      At.microtask(() => this.resolveByDefault(pointer, state))
    } else if (state.members.length === 0) {
      console.log(`tryToResolveArena`)
      this.arenas.delete(pointer)
    } else if (state.eagerWinner != null) {
      this.resolveInFavorOf(pointer, state, state.eagerWinner!)
    }
  }

  resolveByDefault (pointer: number, state: AtGestureArena) {
    if (!this.arenas.has(pointer)) {
      return
    }

    invariant(this.arenas.get(pointer) === state)
    invariant(!state.isOpen)
    const members = state.members
    invariant(members.length === 1)
    console.log(`resolveByDefault`)
    this.arenas.delete(pointer)
    const member = state.members[0]
    member.accept(pointer)
  }

  private resolveInFavorOf (pointer: number, state: AtGestureArena, member: AtGestureArenaMember) {
    invariant(state === this.arenas.get(pointer))
    invariant(state !== null)
    invariant(state.eagerWinner == null || state.eagerWinner == member)
    invariant(!state.isOpen)
    
    console.log(`resolveInFavorOf`)
    this.arenas.delete(pointer)
    
    for (const rejectedMember of state.members) {
      if (rejectedMember !== member) {
        rejectedMember.reject(pointer)
      }
    }
    
    member.accept(pointer)
  }
}
