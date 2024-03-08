import { invariant } from '@at/utils'
import { PointerChangeKind, SanitizedPointerEvent } from '@at/gesture'

export enum MouseCursorKind {
  Alias = 'alias',
  AllScroll = 'all-scroll',
  Basic = 'default',
  Cell = 'cell',
  Click = 'pointer',
  ContextMenu = 'context-menu',
  Copy = 'copy',
  Disappearing = "disappearing",
  Forbidden = 'not-allowed',
  Grab = 'grab',
  Grabbing = 'grabbing',
  Help = 'help',
  Move = 'move',
  None = 'none',
  NoDrop = 'no-drop',
  Precise = 'crosshair',
  Progress = 'progress',
  Text = 'text',
  ResizeColumn = 'col-resize',
  ResizeDown = 's-resize',
  ResizeDownLeft = 'sw-resize',
  ResizeDownRight = 'se-resize',
  ResizeLeft = 'w-resize',
  ResizeLeftRight = 'ew-resize',
  ResizeRight = 'e-resize',
  ResizeRow = 'row-resize',
  ResizeUp = 'n-resize',
  ResizeUpDown = 'ns-resize',
  ResizeUpLeft = 'nw-resize',
  ResizeUpRight = 'ne-resize',
  ResizeUpLeftDownRight = 'nwse-resize',
  ResizeUpRightDownLeft = 'nesw-resize',
  VerticalText = 'vertical-text',
  Wait = 'wait',
  ZoomIn = 'zoom-in',
  ZoomOut = 'zoom-out'
}

export class MouseCursorSession {
  static create (cursor: MouseCursor, device: number) {
    return new MouseCursorSession(cursor, device)
  }

  public cursor: MouseCursor
  public device: number

  constructor (
    cursor: MouseCursor, 
    device: number
  ) {
    this.cursor = cursor
    this.device = device
  }

  dispose (): void { }
}


export class MouseCursor {
  static create (kind: MouseCursorKind) {
    return new MouseCursor(kind)
  }

  public kind: MouseCursorKind

  constructor (kind: MouseCursorKind) {
    this.kind = kind
  }

  createSession (device: number) {
    return MouseCursorSession.create(this, device)
  }

  equal (other: MouseCursor | null) {
    return (
      other instanceof MouseCursor &&
      this.kind === other.kind
    )
  }

  notEqual (other: MouseCursor | null) {
    return !this.equal(other)
  }   
}


export class MouseCursorManager {
  static create (fallback: MouseCursor = basic) {
    return new MouseCursorManager(fallback)
  }

  public lastSession: Map<number, MouseCursorSession> = new Map()
  public fallback: MouseCursor

  constructor (fallback: MouseCursor = basic) {
    this.fallback = fallback
  }

  handleCursorUpdate (
    device: number,
    triggeringEvent: SanitizedPointerEvent,
    cursors: MouseCursor[]
  ): MouseCursorSession | undefined {
    if (triggeringEvent.change === PointerChangeKind.Removed) {
      this.lastSession.delete(device)
    } else {
      const lastSession = this.lastSession.get(device) ?? null
      let nextCursor: MouseCursor = this.fallback
  
      for (const cursor of cursors) {
        invariant(cursor !== null)
        if (cursor.notEqual(basic)) {
          nextCursor = cursor
          break
        }
      }
      
      if (lastSession === null || lastSession.cursor.notEqual(nextCursor)) {
        const nextSession = nextCursor.createSession(device)
        this.lastSession.set(device, nextSession)
  
        lastSession?.dispose()
        return nextSession
      }
    }
  }
}

export const none = MouseCursor.create(MouseCursorKind.None)
export const basic = MouseCursor.create(MouseCursorKind.Basic)
export const click = MouseCursor.create(MouseCursorKind.Click)
export const forbidden = MouseCursor.create(MouseCursorKind.Forbidden)
export const wait = MouseCursor.create(MouseCursorKind.Wait)
export const progress = MouseCursor.create(MouseCursorKind.Progress)
export const contextMenu = MouseCursor.create(MouseCursorKind.ContextMenu)
export const help = MouseCursor.create(MouseCursorKind.Help)
export const text = MouseCursor.create(MouseCursorKind.Text)
export const verticalText = MouseCursor.create(MouseCursorKind.VerticalText)
export const cell = MouseCursor.create(MouseCursorKind.Cell)
export const precise = MouseCursor.create(MouseCursorKind.Precise)
export const move = MouseCursor.create(MouseCursorKind.Move)
export const grab = MouseCursor.create(MouseCursorKind.Grab)
export const grabbing = MouseCursor.create(MouseCursorKind.Grabbing)
export const noDrop = MouseCursor.create(MouseCursorKind.NoDrop)
export const alias = MouseCursor.create(MouseCursorKind.Alias)
export const copy = MouseCursor.create(MouseCursorKind.Copy)
export const disappearing = MouseCursor.create(MouseCursorKind.Disappearing)
export const allScroll = MouseCursor.create(MouseCursorKind.AllScroll)
export const resizeLeftRight = MouseCursor.create(MouseCursorKind.ResizeLeftRight)
export const resizeUpDown = MouseCursor.create(MouseCursorKind.ResizeUpDown)
export const resizeUpLeftDownRight = MouseCursor.create(MouseCursorKind.ResizeUpLeftDownRight)
export const resizeUpRightDownLeft = MouseCursor.create(MouseCursorKind.ResizeUpRightDownLeft)
export const resizeUp = MouseCursor.create(MouseCursorKind.ResizeUp)
export const resizeDown = MouseCursor.create(MouseCursorKind.ResizeDown)
export const resizeLeft = MouseCursor.create(MouseCursorKind.ResizeLeft)
export const resizeRight = MouseCursor.create(MouseCursorKind.ResizeRight)
export const resizeUpLeft = MouseCursor.create(MouseCursorKind.ResizeUpLeft)
export const resizeUpRight = MouseCursor.create(MouseCursorKind.ResizeUpRight)
export const resizeDownLeft = MouseCursor.create(MouseCursorKind.ResizeDownLeft)
export const resizeDownRight = MouseCursor.create(MouseCursorKind.ResizeDownRight)
export const resizeColumn = MouseCursor.create(MouseCursorKind.ResizeColumn)
export const resizeRow = MouseCursor.create(MouseCursorKind.ResizeRow)
export const zoomIn = MouseCursor.create(MouseCursorKind.ZoomIn)
export const zoomOut = MouseCursor.create(MouseCursorKind.ZoomOut)
