import { AtPointerEvent } from '../gestures/events'
import { GestureEventCallback } from '../gestures/detector'
import { AtBoxHitTestEntry, AtLayoutBox } from './box'
import { AtListener } from './listener'

export abstract class AtMouseRegion extends AtListener {
  public cursor: string

  constructor (
    child: AtLayoutBox | null = null,
    cursor: string = 'default',
  ) {
    super(
      child, 
    )

    this.cursor = cursor
  }

  handleEvent (event: AtPointerEvent, entry: AtBoxHitTestEntry) {
    super.handleEvent(event, entry)
  }
}