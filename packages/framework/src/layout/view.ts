/*
 * @author: aniwei aniwei.studio@gmail.com
 * @date: 2022-12-01 23:33:36
 */

import { invariant } from 'ts-invariant'
import { Matrix4 } from '../basic/matrix4'
import { Offset, Rect, Size } from '../basic/geometry'
import { AtLayoutObject } from './object'
import { AtTransformLayer } from '../engine/layer'
import { AtBoxConstraints } from './box-constraints'
import { AtBoxHitTestResult } from './box'
import { AtPointerEvent } from '../gestures/events'
import { AtHitTestEntry } from '../gestures/hit-test'
import { AtLayoutContainer } from './container'
import { AtPaintingContext } from './painting-context'
import { AtLayerScene } from '../engine/layer-scene'
import { Subscribable } from '../at'
import { UnimplementedError } from '../basic/error'

export type ViewSceneRasterizeCall = (scene: AtLayerScene) => void

export type AtViewConfigurationOptions = {
  size: Size,
  devicePixelRatio: number
}

export abstract class AtViewConfiguration extends Subscribable {
  public size: Size
  public devicePixelRatio: number

  /**
   * 构造函数
   * @param {Size} size 
   * @param {number} devicePixelRatio 
   */
  constructor (
    size: Size = Size.zero, 
    devicePixelRatio: number,
  ) {
    super()

    this.size = size
    this.devicePixelRatio = devicePixelRatio
  }

  toMatrix (): Matrix4 {
    return Matrix4.diagonal3Values(
      this.devicePixelRatio, 
      this.devicePixelRatio, 
      1
    )
  }
  
  equal (other: AtViewConfiguration | null) {
    return (
      other instanceof AtViewConfiguration &&
      other.size.equal(this.size) &&
      other.devicePixelRatio === this.devicePixelRatio
    )
  }

  notEqual (other: AtViewConfiguration | null) {
    return this.equal(other) === false
  }
  
  toString () {
    return `AtViewConfiguration(${this.size}, ${this.devicePixelRatio})`
  }

  copyWith (size?: Size, devicePixelRatio?: number): AtViewConfiguration {
    throw new UnimplementedError()
  } 

  toJSON () {
    return {
      size: this.size,
      devicePixelRatio: this.devicePixelRatio
    }
  }
}

export type AtViewOptions = {
  child?: AtLayoutObject | null,
  configuration: AtViewConfiguration,
}

export abstract class AtView extends AtLayoutContainer {
  

  // => configuration
  protected _configuration: AtViewConfiguration
  public get configuration () {
    return this._configuration
  }
  public set configuration (configuration: AtViewConfiguration) {
    invariant(configuration !== null, `The argument "configuration" cannot be null.`)
    
    if (this.configuration?.notEqual(configuration)) {
      this._configuration = configuration
      
      if (this.attached) {
        this.replaceRootLayer(this.createNewRootLayer())
        invariant(this.rootTransform !== null, `The this rootTransform cannot be null.`)
        this.markNeedsLayout()
      }
    }
  }
  
  // => rasterize
  private _rasterize: ViewSceneRasterizeCall | null = null
  public get rasterize (): ViewSceneRasterizeCall {
    invariant(this._rasterize !== null)
    return this._rasterize
  }
  public set rasterize (callback: ViewSceneRasterizeCall) {
    this._rasterize = callback
  }

  // => frames
  public get bounds (): Rect {
    return Offset.zero.and(this.configuration.size)
  }

  // => size
  public get size (): Size {
    return this.configuration.size
  }
  
  public rootTransform: Matrix4 | null = null
  public isRepaintBoundary: boolean = true

  /**
   * 
   * @param child 
   * @param configuration 
   */
  constructor (configuration: AtViewConfiguration | null) {
    
    super()
    invariant(configuration !== null, `The argument "configuration" cannot be null.`)
    this._configuration = configuration  
  }

  handleEvent (event: AtPointerEvent, entry: AtHitTestEntry): void {
    
  }

  prepareInitial () {
    invariant(this.owner !== null, `The "this.owner" cannot be null.`)
    invariant(this.rootTransform === null, `The "this.rootTransform" must be null.`)
    
    this.scheduleInitialLayout()
    this.scheduleInitialPaint(this.createNewRootLayer())
    invariant(this.rootTransform !== null, `The "this.rootTransform" cannot be null.`)
  }

  createNewRootLayer (): AtTransformLayer {
    this.rootTransform = this.configuration.toMatrix()
    // this.rootTransform?.translate(this.configuration.size.width / 2, this.configuration.size.width / 2)
    const rootLayer = AtTransformLayer.create(Offset.zero, this.rootTransform)    
    rootLayer.attach(this)

    return rootLayer
  }

  performResize () {
    invariant(false)
  }
  
  performLayout () {
    invariant(this.rootTransform !== null, `The rootTransform cannot be null.`)

    if (this.child !== null) {
      this.child.layout(AtBoxConstraints.tight(this.size))
    }
  }

  rotate (
    oldAngle?: number | null, 
    newAngle?: number | null, 
    time?: number | null
  ) {
    
  }

  /**
   * 
   * @param {AtPaintingContext} context 
   * @param {Offset} offset 
   */
  paint (context: AtPaintingContext, offset: Offset) {
    if (this.firstChild !== null) {
      context.paintChild(this.firstChild, offset)
    }
  }

  /**
   * 
   * @param child 
   * @param transform 
   */
  applyPaintTransform (
    child: AtLayoutObject,
    transform: Matrix4
  ) {
    invariant(this.rootTransform !== null, `The "this.rootTransform" cannt be null.`)
    transform.multiply(this.rootTransform!)
    super.applyPaintTransform(child, transform)
  }

  composite () {
    invariant(this.layer, `The  "this.layer" cannot be null.`)

    try {
      this.owner?.rasterizer.draw(AtLayerScene.create(this.layer).tree)
    } finally {
      // 
    }
  }

  hitTest (result: AtBoxHitTestResult, position: Offset) {
    if (this.child !== null) {
      this.child.hitTest(AtBoxHitTestResult.wrap(result), position)
    }

    result.add(AtHitTestEntry.create(this))
    return true
  }
}