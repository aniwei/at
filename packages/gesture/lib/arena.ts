import { invariant } from '@at/utils'
import { nextTick } from '@at/basic'

// 手势处置枚举
export enum GestureDispositionKind {
  Accepted,
  Rejected,
}

//// => GestureArenaMember
// 竞技场成员
export abstract class GestureArenaMember {
  abstract accept (pointer: number): void
  abstract reject (pointer: number): void
}

export interface GestureArenaEntryOptions {
  arena: GestureArenaManager,
  pointer: number,
  member: GestureArenaMember,
}

// 手势竞技场入口
export class GestureArenaEntry {
  static create (...rests: unknown[]): GestureArenaEntry
  static create (options: GestureArenaEntryOptions) {
    return new GestureArenaEntry(
      options.arena,
      options.pointer,
      options.member,
    )
  }

  // 竞技场
  public arena: GestureArenaManager 
  // 成员
  public member: GestureArenaMember
  
  protected pointer: number

  constructor (...rests: unknown[]) 
  /**
   * 构造函数
   * @param {GestureArenaManager} arena 
   * @param {number} pointer 
   * @param {GestureArenaMember} member 
   */
  constructor (
    arena: GestureArenaManager,
    pointer: number,
    member: GestureArenaMember,
  ) {
    this.arena = arena
    this.pointer = pointer
    this.member = member
  }

  resolve (disposition: GestureDispositionKind) {
    this.arena.resolve(
      this.pointer, 
      this.member, 
      disposition
    )
  }
}


//// => GestureArena
// 竞技场状态
export enum GestureArenaStateKind {
  Open,
  Held
}

// 手势竞技场
export class GestureArena {
  // => opened
  public get opened () {
    return (this.state & GestureArenaStateKind.Open) === GestureArenaStateKind.Open
  }
  public set opened (opened: boolean) {
    opened 
      ? this.state |= GestureArenaStateKind.Open
      : this.state &= ~GestureArenaStateKind.Open
  }

  // => held
  public get held () {
    return (this.state & GestureArenaStateKind.Held) === GestureArenaStateKind.Held
  }
  public set held (held: boolean) {
    held 
      ? this.state |= GestureArenaStateKind.Held
      : this.state &= ~GestureArenaStateKind.Held
  }

  public hasPendingSweep: boolean = false
  public members: GestureArenaMember[] = []
  public state: GestureArenaStateKind = GestureArenaStateKind.Open

  // 获胜者
  public eagerWinner: GestureArenaMember | null = null

  /**
   * 添加竞技成员
   * @param {GestureArenaMember} member 
   */
  add (member: GestureArenaMember) {
    invariant(this.opened, 'The "GestureArena.opened" cannot be held, must be opened.')
    this.members.push(member)
  }

  toString () {
    return `GestureArena(
      [members]: ${this.members.length}
    )`
  }
}

// 竞技场管理管理
// 根据 device id 来管理
export class GestureArenaManager {
  static create () {
    return new GestureArenaManager()
  }

  protected arenas: Map<number, GestureArena> = new Map<number, GestureArena>()

  /**
   * 
   * @param pointer 
   * @param state 
   */
  tryToResolveArena (pointer: number, arena: GestureArena) {
    invariant(this.arenas.get(pointer) === arena)
    invariant(!arena.opened)
    if (arena.members.length == 1) {
      nextTick(() => this.resolveByDefault(pointer, arena))
    } else if (arena.members.length === 0) {
      this.arenas.delete(pointer)
    } else if (arena.eagerWinner != null) {
      this.resolveInFavorOf(pointer, arena, arena.eagerWinner as GestureArenaMember)
    }
  }

  /**
   * 
   * @param pointer 
   * @param state 
   * @param member 
   */
  resolveInFavorOf (pointer: number, arena: GestureArena, member: GestureArenaMember) {
    invariant(arena === this.arenas.get(pointer))
    invariant(arena !== null)
    invariant(arena.eagerWinner === null || arena.eagerWinner === member)
    invariant(!arena.opened)
    
    this.arenas.delete(pointer)
    
    for (const rejectedMember of arena.members) {
      if (rejectedMember !== member) {
        rejectedMember.reject(pointer)
      }
    }
    
    member.accept(pointer)
  }

  /**
   * 
   * @param pointer 
   * @param member 
   * @returns 
   */
  add (pointer: number, member: GestureArenaMember): GestureArenaEntry {
    if (!this.arenas.has(pointer)) {
      this.arenas.set(pointer, new GestureArena())
    }

    const arena = this.arenas.get(pointer) as GestureArena
    arena.add(member)

    return GestureArenaEntry.create({ 
      arena: this, 
      pointer, 
      member 
    })
  }

  /**
   * 关闭竞技场
   * @param pointer 
   */
  close (pointer: number) {
    const state: GestureArena | null = this.arenas.get(pointer) ?? null
    if (state !== null) {
      state.state |= GestureArenaStateKind.Open
      this.tryToResolveArena(pointer, state)
    }
  }

  /**
   * 
   * @param pointer 
   * @returns 
   */
  sweep (pointer: number) {
    const arena: GestureArena | null = this.arenas.get(pointer) ?? null
    
    if (arena !== null) {
      invariant(!arena.opened)
      if (arena.held) {
        arena.hasPendingSweep = true
        return
      }
      
      this.arenas.delete(pointer)
      if (arena.members.length > 0) {
        const member = arena.members[0]
        member.accept(pointer)
      
        for (let i = 1; i < arena.members.length; i++) {
          arena.members[i].reject(pointer)
        }
      }
    }
  }

  /**
   * 
   * @param pointer 
   */
  hold (pointer: number) {
    const arena: GestureArena | null = this.arenas.get(pointer) ?? null
    if (arena !== null) {
      arena.held = true
    }
  }

  /**
   * 
   * @param pointer 
   */
  release (pointer: number) {
    const state: GestureArena | null = this.arenas.get(pointer) ?? null
    if (state !== null) {
      state.held = false
      if (state.hasPendingSweep) {
        this.sweep(pointer)
      }
    }
  }

  /**
   * 
   * @param pointer 
   * @param member 
   * @param disposition 
   */
  resolve (
    pointer: number, 
    member: GestureArenaMember, 
    disposition: GestureDispositionKind
  ) {
    const arena: GestureArena | null = this.arenas.get(pointer) ?? null
    
    if (arena !== null) {
      if (disposition === GestureDispositionKind.Rejected) {
        const index = arena.members.indexOf(member)
        if (index > -1) {
          invariant(arena.members.includes(member))
          arena.members.splice(index, 1)
        }
        member.reject(pointer)
        if (!arena.opened) {
          this.tryToResolveArena(pointer, arena)
        }
      } else {
        invariant(disposition === GestureDispositionKind.Accepted)
        if (arena.opened) {
          arena.eagerWinner ??= member
        } else {
          this.resolveInFavorOf(pointer, arena, member)
        }
      }
    }
  }

  /**
   * 
   * @param pointer 
   * @param state 
   */
  resolveByDefault (pointer: number, arena: GestureArena) {
    if (this.arenas.has(pointer)) {
      invariant(this.arenas.get(pointer) === arena)
      invariant(!arena.opened)

      const members = arena.members
      invariant(members.length === 1)
      this.arenas.delete(pointer)
      const member = arena.members[0]
      member.accept(pointer)
    }
  }
}
