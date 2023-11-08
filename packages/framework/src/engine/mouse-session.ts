import invariant from '@at/utils'
import { UnimplementedError } from '..c/basic/error'
import { AtPointerEvent } from '../gestures/events'

export class AtMouseCursorManager {
  
  public fallbackMouseCursor: AtMouseCursor
  public lastSession:  Map<number, AtMouseCursorSession> = new Map()

  constructor (fallbackMouseCursor: AtMouseCursor) {
    this.fallbackMouseCursor = fallbackMouseCursor
  }

  /**
   * 
   * @param {number} device 
   * @param {AtPointerEvent | null} triggeringEvent 
   * @param {AtMouseCursor[]} cursorCandidates 
   * @returns 
   */
  handleDeviceCursorUpdate (
    device: number,
    triggeringEvent: AtPointerEvent | null,
    cursorCandidates: AtMouseCursor[],
  ) {
    if (triggeringEvent?.isRemoved()) {
      this.lastSession.delete(device)
      return
    }

    const lastSession: AtMouseCursorSession | null = this.lastSession.get(device) ?? null
    const nextCursor = AtDeferringMouseCursor.firstNonDeferred(cursorCandidates) ?? this.fallbackMouseCursor
    invariant(nextCursor instanceof AtDeferringMouseCursor)
    
    if (lastSession?.cursor === nextCursor) {
      return
    }

    const nextSession = nextCursor.createSession(device);
    this.lastSession.set(device, nextSession)
    
    lastSession?.dispose()
    nextSession.activate()
  }
}

export abstract class AtMouseCursorSession {
  
  constructor (
    cursor: AtMouseCursor,
    device: number
  ) {
    this.cursor = cursor
    this.device = device
  }
    
  public cursor: AtMouseCursor
  public device: number

  abstract activate(): Promise<void>
  abstract dispose (): void
}


export abstract class AtMouseCursor  {
  abstract createSession(device: number): AtMouseCursorSession
  static defer: AtMouseCursor = new AtDeferringMouseCursor()
  static uncontrolled: AtMouseCursor = new AtNoopMouseCursor()
}

export class AtNoopMouseCursor extends AtMouseCursor {
  createSession (device: number) {
    return new AtNoopMouseCursorSession(this, device)
  }
}


export class AtDeferringMouseCursor extends AtMouseCursor {
  static firstNonDeferred (cursors: AtMouseCursor[]):  AtMouseCursor | null {
    for (const cursor of cursors) {
      invariant(cursor !== null);
      if (cursor !== AtMouseCursor.defer)
        return cursor
    }

    return null
  }

  createSession (device: number): AtMouseCursorSession {
    throw new UnimplementedError()
  }

}

export class AtNoopMouseCursorSession extends AtMouseCursorSession {
  activate (): Promise<void> { }
  dispose () {  }
}

export class AtSystemMouseCursorSession extends AtMouseCursorSession {
  activate (): Promise<void> {
    return AtSystemChannels.mouseCursor.invokeMethod<void>(
      'activateSystemCursor',
      {
        device: this.device,
        'kind': this.cursor.kind,
      },
    )
  }

  dispose () {}
}

export class AtSystemMouseCursor extends AtMouseCursor {
  public kind: string

  constructor (kind: string) {
    super()
    this.kind = kind
  }


  createSession (device: number): AtMouseCursorSession {
    return new AtSystemMouseCursorSession(this, device)
  }

  equal (other: AtSystemMouseCursor | null) {
    return other instanceof AtSystemMouseCursor && other.kind === this.kind
  }

  notEqual (other: AtSystemMouseCursor | null) {
    return !this.equal(other)
  }
}

export class AtSystemMouseCursors {
  static none: AtSystemMouseCursor = new AtSystemMouseCursor('none')
  static basic: AtSystemMouseCursor = new AtSystemMouseCursor('basic')
  static click: AtSystemMouseCursor = new AtSystemMouseCursor('click')
  static forbidden: AtSystemMouseCursor = new AtSystemMouseCursor('forbidden')
  static wait: AtSystemMouseCursor = new AtSystemMouseCursor('wait')
  static progress: AtSystemMouseCursor = new AtSystemMouseCursor('progress')
  static contextMenu: AtSystemMouseCursor = new AtSystemMouseCursor('contextMenu')
  static help: AtSystemMouseCursor = new AtSystemMouseCursor('help')
  static text: AtSystemMouseCursor = new AtSystemMouseCursor('text')
  static verticalText: AtSystemMouseCursor = new AtSystemMouseCursor('verticalText')
  static cell: AtSystemMouseCursor = new AtSystemMouseCursor('cell')
  static precise: AtSystemMouseCursor = new AtSystemMouseCursor('precise')
  static move: AtSystemMouseCursor = new AtSystemMouseCursor('move')
  static grab: AtSystemMouseCursor = new AtSystemMouseCursor('grab')
  static grabbing: AtSystemMouseCursor = new AtSystemMouseCursor('grabbing')
  static noDrop: AtSystemMouseCursor = new AtSystemMouseCursor('noDrop')
  static alias: AtSystemMouseCursor = new AtSystemMouseCursor('alias')
  static copy: AtSystemMouseCursor = new AtSystemMouseCursor('copy')
  static disappearing: AtSystemMouseCursor = new AtSystemMouseCursor('disappearing')
  static allScroll: AtSystemMouseCursor = new AtSystemMouseCursor('allScroll')
  static resizeLeftRight: AtSystemMouseCursor = new AtSystemMouseCursor('resizeLeftRight')
  static resizeUpDown: AtSystemMouseCursor = new AtSystemMouseCursor('resizeUpDown')
  static resizeUpLeftDownRight: AtSystemMouseCursor = new AtSystemMouseCursor('resizeUpLeftDownRight')
  static resizeUpRightDownLeft: AtSystemMouseCursor = new AtSystemMouseCursor('resizeUpRightDownLeft')
  static resizeUp: AtSystemMouseCursor = new AtSystemMouseCursor('resizeUp')
  static resizeDown: AtSystemMouseCursor = new AtSystemMouseCursor('resizeDown')
  static resizeLeft: AtSystemMouseCursor = new AtSystemMouseCursor('resizeLeft')
  static resizeRight: AtSystemMouseCursor = new AtSystemMouseCursor('resizeRight')
  static resizeUpLeft: AtSystemMouseCursor = new AtSystemMouseCursor('resizeUpLeft')
  static resizeUpRight: AtSystemMouseCursor = new AtSystemMouseCursor('resizeUpRight')
  static resizeDownLeft: AtSystemMouseCursor = new AtSystemMouseCursor('resizeDownLeft')
  static resizeDownRight: AtSystemMouseCursor = new AtSystemMouseCursor('resizeDownRight')
  static resizeColumn: AtSystemMouseCursor = new AtSystemMouseCursor('resizeColumn')
  static resizeRow: AtSystemMouseCursor = new AtSystemMouseCursor('resizeRow')
  static zoomIn: AtSystemMouseCursor = new AtSystemMouseCursor('zoomIn')
  static zoomOut: AtSystemMouseCursor = new AtSystemMouseCursor('zoomOut')
}
