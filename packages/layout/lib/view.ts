import { UnimplementedError, invariant } from '@at/utils'
import { Matrix4 } from '@at/math'
import { Offset, Rect, Size } from '@at/geometry'
import { Object } from './object'
import { TransformLayer } from '@at/engine'
import { BoxConstraints } from './constraints'
import { Subscribable } from '@at/basic'


export type ViewSceneRasterizeCall = (scene: LayerScene) => void

export type ViewConfigurationOptions = {
  size: Size,
  devicePixelRatio: number
}

export abstract class ViewConfiguration extends Subscribable {
  public size: Size
  public devicePixelRatio: number

  /**
   * 构造函数
   * @param {Size} size 
   * @param {number} devicePixelRatio 
   */
  constructor (
    size: Size = Size.ZERO, 
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

  copyWith (size?: Size, devicePixelRatio?: number): ViewConfiguration {
    throw new UnimplementedError()
  } 

  toJSON () {
    return {
      size: this.size,
      devicePixelRatio: this.devicePixelRatio
    }
  }
  
  equal (other: ViewConfiguration | null) {
    return (
      other instanceof ViewConfiguration &&
      other.size.equal(this.size) &&
      other.devicePixelRatio === this.devicePixelRatio
    )
  }

  notEqual (other: ViewConfiguration | null) {
    return !this.equal(other)
  }
  
  toString () {
    return `ViewConfiguration(
      [size]: ${this.size}, 
      [devicePixelRatio]: ${this.devicePixelRatio}
    )`
  }
}

export type ViewOptions = {
  child?: Object | null,
  configuration: ViewConfiguration,
}

export abstract class View extends Container {
  

  // => configuration
  protected _configuration: ViewConfiguration
  public get configuration () {
    return this._configuration
  }
  public set configuration (configuration: ViewConfiguration) {    
    if (
      this.configuration === null || 
      this.configuration?.notEqual(configuration)
    ) {
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
    return Offset.ZERO.and(this.configuration.size)
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

  handleEvent (event: AtPointerEvent, entry: HitTestEntry): void {
    
  }

  prepareInitial () {
    invariant(this.owner !== null, `The "this.owner" cannot be null.`)
    invariant(this.rootTransform === null, `The "this.rootTransform" must be null.`)
    
    this.scheduleInitialLayout()
    this.scheduleInitialPaint(this.createNewRootLayer())
    invariant(this.rootTransform !== null, `The "this.rootTransform" cannot be null.`)
  }

  createNewRootLayer (): TransformLayer {
    this.rootTransform = this.configuration.toMatrix()
    // this.rootTransform?.translate(this.configuration.size.width / 2, this.configuration.size.width / 2)
    const rootLayer = TransformLayer.create(Offset.ZERO, this.rootTransform)    
    rootLayer.attach(this)

    return rootLayer
  }

  performResize () {
    invariant(false)
  }
  
  performLayout () {
    invariant(this.rootTransform !== null, `The rootTransform cannot be null.`)

    if (this.child !== null) {
      this.child.layout(BoxConstraints.tight(this.size))
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