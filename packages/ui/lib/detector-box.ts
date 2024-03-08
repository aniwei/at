import { Box } from './box'

import { Offset } from '@at/geometry'
import { 
  GestureDetector, 
  SanitizedPointerEvent 
} from '@at/gesture'

import { PipelineOwner } from './pipeline-owner'
import { BoxHitTestEntry, BoxHitTestResult } from './box-hit-test'
import { PaintingContext } from './painting-context'
import { Engine } from 'packages/engine/types/lib'

//// => DetectorBox
export interface DetectorBoxOptions {
  child: Box | null
}

export abstract class DetectorBox extends Box {
  // => detector
  // 手势
  protected _detector: GestureDetector | null = null
  public get detector () {
    return this._detector as GestureDetector
  }
  public set detector (detector: GestureDetector | null) {
    if (
      detector === null || 
      detector !== this._detector
    ) {
      if (this._detector !== null) {
        this._detector.dispose()
      }

      this._detector = detector
    }
  }

  // => owner
  public set owner (owner: PipelineOwner | null) {
    if (
      super.owner === null || 
      super.owner !== owner
    ) {
      this.detector?.dispose()
      this.detector = null
      
      super.owner = owner
    }
  }
  public get owner () {
    return super.owner
  }

  constructor (
    child: Box | null,
    ...rests: unknown[]
  ) {
    super(child ? [child] : null)
  }

  /**
   * 处理事件
   * @param {SanitizedPointerEvent} event 
   * @param {BoxHitTestEntry} entry 
   */
  handleEvent (event: SanitizedPointerEvent, entry: BoxHitTestEntry) {
    this.detector?.handleEvent(event, entry)
  }

  /**
   * 自定义子节点碰撞测试
   * @param {BoxHitTestResult} result 
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestChildren (
    result: BoxHitTestResult, 
    position: Offset
  ) {
    return this.defaultHitTestChildren(result, position)
  }

  /**
   * 自身碰撞测试
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestSelf (position: Offset) {
    return false
  }

  paint (context: PaintingContext, offset: Offset): void {
    this.defaultPaint(context, offset)
  }

  attach (owner: PipelineOwner): void {
    super.attach(owner)
    this.detector = GestureDetector.create((owner as PipelineOwner).engine as Engine)
  }

  detach (): void {
    this.detector?.dispose()
    this.detector = null

    super.detach()
  }

  dispose (): void {
    this.detector?.dispose()
    this.detector = null

    super.dispose()
  }
}