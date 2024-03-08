import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { PointerChangeKind, SanitizedPointerEvent } from '@at/gesture'
import { MouseCursor, MouseTrackerAnnotation, MouseEvent } from '@at/mouse'
import { BoxHitTestEntry, BoxHitTestResult } from './box-hit-test'
import { PaintingContext } from './painting-context'
import { Box } from './box'

import * as MouseCursors from '@at/mouse'

//// => MouseRegion
// 鼠标区域
export interface MouseRegionBoxOptions {
  child?: Box | null,
  validForMouseTracker?: boolean,
  cursor?: MouseCursor
  onEnter?: MouseEvent,
  onHover?: MouseEvent,
  onExit?: MouseEvent
}

export class MouseRegionBox extends Box implements MouseTrackerAnnotation {
  static create (options?: MouseRegionBoxOptions) {
    return new MouseRegionBox(
      options?.child,
      options?.validForMouseTracker,
      options?.cursor,
      options?.onEnter,
      options?.onHover,
      options?.onExit
    )
  }

  // => cursor
  protected _cursor: MouseCursor | null = null
  public get cursor () {
    invariant(this._cursor !== null, 'The "MouseRegionBox.cursor" cannot be null.')
    return this._cursor
  }
  public set cursor (cursor: MouseCursor) {
    if (
      this._cursor === null ||
      this._cursor !== cursor
    ) {
      this._cursor = cursor
      this.markNeedsPaint()
    }
  }

  public validForMouseTracker: boolean = true
  public onEnter: MouseEvent | null = null
  public onHover: MouseEvent | null = null
  public onExit: MouseEvent | null = null

  constructor (
    child: Box | null = null,
    validForMouseTracker: boolean = true,
    cursor: MouseCursor = MouseCursors.basic,
    onEnter: MouseEvent | null = null,
    onHover: MouseEvent | null = null,
    onExit: MouseEvent | null = null,
  ) {
    super([child])

    this.cursor = cursor
    this.validForMouseTracker = validForMouseTracker
    this.onEnter = onEnter
    this.onHover = onHover
    this.onExit = onExit
  }

  handleEvent (event: SanitizedPointerEvent, entry: BoxHitTestEntry): void {
    if (this.onHover !== null && event.change === PointerChangeKind.Hover) {
      return this.onHover(event)
    }
  }

  hitTestSelf (position: Offset): boolean {
    return true
  }

  /**
   * 碰撞测试
   * @param {BoxHitTestResult} result 
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestChildren (
    result: BoxHitTestResult, 
    position: Offset
  ): boolean {
    return this.defaultHitTestChildren(result, position)
  }

  paint(context: PaintingContext, offset: Offset): void {
    return this.defaultPaint(context, offset)
  }
}