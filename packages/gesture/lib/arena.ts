import { invariant } from '@at/utils'
import { nextTick } from '@at/basic'
import { GestureDispositionKind } from './gesture'


//// => GestureArenaMember
// 竞技场成员抽象类
export abstract class GestureArenaMember {
  abstract accept (id: number): void
  abstract reject (id: number): void
}

//// => GestureArenaEntry
// 手势竞技场入口
export interface GestureArenaEntryOptions {
  id: number,
  arena: GestureArenaManager,
  member: GestureArenaMember,
}

export class GestureArenaEntry {
  static create (...rests: unknown[]): GestureArenaEntry
  /**
   * 
   * @param {GestureArenaEntryOptions} options 
   * @returns {GestureArenaEntry}
   */
  static create (options: GestureArenaEntryOptions) {
    return new GestureArenaEntry(
      options.arena,
      options.id,
      options.member,
    )
  }

  // 竞技场
  public arena: GestureArenaManager 
  // 成员
  public member: GestureArenaMember
  // id
  protected id: number

  constructor (...rests: unknown[]) 
  /**
   * 构造函数
   * @param {GestureArenaManager} arena 
   * @param {number} id 
   * @param {GestureArenaMember} member 
   */
  constructor (
    arena: GestureArenaManager,
    id: number,
    member: GestureArenaMember,
  ) {
    this.id = id
    this.arena = arena
    this.member = member
  }

  resolve (disposition: GestureDispositionKind) {
    this.arena.resolve(
      this.id, 
      this.member, 
      disposition
    )
  }
}


//// => GestureArena
// 竞技场状态
export enum GestureArenaStateKind {
  Open = 1,
  Held
}

// 手势竞技场
export class GestureArena {
  static create (...rests: unknown[]) {
    return new GestureArena()
  }

  // => opened
  // 是否开启
  public get opened () {
    return (this.state & GestureArenaStateKind.Open) === GestureArenaStateKind.Open
  }
  public set opened (opened: boolean) {
    opened 
      ? this.state |= GestureArenaStateKind.Open
      : this.state &= ~GestureArenaStateKind.Open
  }

  // => held
  // 是否挂起
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
   * @param {number} pointer 
   * @param {GestureArena} state 
   */
  tryToResolveArena (id: number, arena: GestureArena) {
    invariant(this.arenas.get(id) === arena)
    invariant(!arena.opened, 'The "arena" cannot be opened.')
    if (arena.members.length === 1) {
      nextTick(() => this.resolveByDefault(id, arena))
    } else if (arena.members.length === 0) {
      this.arenas.delete(id)
    } else if (arena.eagerWinner !== null) {
      this.resolveInFavorOf(id, arena, arena.eagerWinner as GestureArenaMember)
    }
  }

  /**
   * 
   * @param pointer 
   * @param state 
   * @param member 
   */
  resolveInFavorOf (id: number, arena: GestureArena, member: GestureArenaMember) {
    invariant(arena === this.arenas.get(id))
    invariant(arena !== null, 'The "arena" cannot be null.')
    invariant(arena.eagerWinner === null || arena.eagerWinner === member)
    invariant(!arena.opened)
    
    this.arenas.delete(id)
    // 拒绝其他竞争成员
    for (const rejectedMember of arena.members) {
      if (rejectedMember !== member) {
        rejectedMember.reject(id)
      }
    }
    
    member.accept(id)
  }

  /**
   * 
   * @param {number} id 
   * @param {GestureArenaMember} member 
   * @returns {GestureArenaEntry}
   */
  add (
    id: number, 
    member: GestureArenaMember
  ): GestureArenaEntry {
    if (!this.arenas.has(id)) {
      this.arenas.set(id, GestureArena.create())
    }

    const arena = this.arenas.get(id) as GestureArena
    arena.add(member)

    return GestureArenaEntry.create({ 
      arena: this, 
      id, 
      member 
    })
  }

  /**
   * 关闭竞技场
   * @param pointer 
   */
  close (id: number) {
    const arena: GestureArena | null = this.arenas.get(id) ?? null
    if (arena !== null) {
      arena.state = arena.state &~ GestureArenaStateKind.Open
      this.tryToResolveArena(id, arena)
    }
  }

  /**
   * 
   * @param {number} id 
   * @returns 
   */
  sweep (id: number) {
    const arena: GestureArena | null = this.arenas.get(id) ?? null
    
    if (arena !== null) {
      if (arena.held) {
        arena.hasPendingSweep = true
        return
      }
      
      this.arenas.delete(id)
      if (arena.members.length > 0) {
        const member = arena.members[0]
        member.accept(id)
      
        for (let i = 1; i < arena.members.length; i++) {
          arena.members[i].reject(id)
        }
      }
    }
  }

  /**
   * 
   * @param {number} id 
   */
  hold (id: number) {
    const arena: GestureArena | null = this.arenas.get(id) ?? null
    if (arena !== null) {
      arena.held = true
    }
  }

  /**
   * 
   * @param id 
   */
  release (id: number) {
    const state: GestureArena | null = this.arenas.get(id) ?? null
    if (state !== null) {
      state.held = false
      if (state.hasPendingSweep) {
        this.sweep(id)
      }
    }
  }

  /**
   * 
   * @param {number} id 
   * @param {GestureArenaMember} member 
   * @param {GestureDispositionKind} disposition 
   */
  resolve (
    id: number, 
    member: GestureArenaMember, 
    disposition: GestureDispositionKind
  ) {
    const arena: GestureArena | null = this.arenas.get(id) ?? null
    
    if (arena !== null) {
      if (disposition === GestureDispositionKind.Rejected) {
        const index = arena.members.indexOf(member)
        if (index > -1) {
          invariant(arena.members.includes(member))
          arena.members.splice(index, 1)
        }
        member.reject(id)
        if (!arena.opened) {
          this.tryToResolveArena(id, arena)
        }
      } else {
        invariant(disposition === GestureDispositionKind.Accepted)
        if (arena.opened) {
          arena.eagerWinner ??= member
        } else {
          this.resolveInFavorOf(id, arena, member)
        }
      }
    }
  }

  /**
   * 
   * @param {number} id 
   * @param {GestureArena} arena 
   */
  resolveByDefault (
    id: number, 
    arena: GestureArena
  ) {
    if (this.arenas.has(id)) {
      invariant(!arena.opened, 'The "arena" cannot be opened.')

      const members = arena.members
      invariant(members.length === 1)
      this.arenas.delete(id)
      const member = arena.members[0]
      member.accept(id)
    }
  }
}
