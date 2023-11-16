import { UnimplementedError, invariant } from '@at/utils'
import { Matrix4 } from '@at/math'
import { Subscribable } from '@at/basic'
import { HitTestEntry } from '@at/gesture'
import { Offset, Rect, Size } from '@at/geometry'
import { ContainerLayer, LayerScene, TransformLayer } from '@at/engine'
import { Object } from './object'
import { BoxConstraints } from './constraints'
import { Container } from './container'
import { PaintingContext } from './painting-context'
import { BoxHitTestResult } from './box-hit-test'


export type ViewSceneRasterizeHandle = (scene: LayerScene) => void

//// => ViewConfiguration
// 视图配置
export interface ViewConfigurationOptions {
  width: number,
  height: number,
  devicePixelRatio: number
}

export interface ViewConfigurationFactory<T> {
  new (
    width: number,
    height: number,
    devicePixelRatio: number,
  ): T
  new (...rests: unknown[]): T
  create (options: ViewConfigurationOptions): T
}
export abstract class ViewConfiguration extends Subscribable {
  static create <T extends ViewConfiguration> (...rests: unknown[]): ViewConfiguration
  static create <T extends ViewConfiguration> (options: ViewConfigurationOptions): ViewConfiguration {
    const ViewConfigurationFactory = this as unknown as ViewConfigurationFactory<T>
    return new ViewConfigurationFactory(
      options.width,
      options.height,
      options.devicePixelRatio
    )
  }

  public width: number
  public height: number
  public devicePixelRatio: number

  /**
   * 构造函数
   * @param {number} devicePixelRatio 
   */
  constructor (...rests: unknown[])
  constructor (
    width: number,
    height: number,
    devicePixelRatio: number,
  ) {
    super()

    this.width = width
    this.height = height
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
      other.width === this.width &&
      other.height === this.height &&
      other.devicePixelRatio === this.devicePixelRatio
    )
  }

  notEqual (other: ViewConfiguration | null) {
    return !this.equal(other)
  }
  
  toString () {
    return `ViewConfiguration(
      [width]: ${this.width}, 
      [height]: ${this.height}, 
      [devicePixelRatio]: ${this.devicePixelRatio}
    )`
  }
}

//// => View
export class View extends Container {
  static create (configuration: ViewConfiguration) {
    return new View(configuration) as View
  }

  // => configuration
  // 视图配置
  protected _configuration: ViewConfiguration | null = null
  public get configuration () {
    invariant(this._configuration)
    return this._configuration
  }
  public set configuration (configuration: ViewConfiguration) {    
    if (
      this._configuration === null || 
      this._configuration?.notEqual(configuration)
    ) {
      this._configuration = configuration
      
      if (this.attached) {
        this.replaceRootLayer(this.createNewRootLayer())
        invariant(this.rootTransform !== null, `The "View.rootTransform" cannot be null.`)
        this.markNeedsLayout()
      }
    }
  }
  
  // => rasterize
  // 光栅化回调
  protected _rasterize: ViewSceneRasterizeHandle | null = null
  public get rasterize (): ViewSceneRasterizeHandle {
    invariant(this._rasterize !== null)
    return this._rasterize
  }
  public set rasterize (callback: ViewSceneRasterizeHandle) {
    this._rasterize = callback
  }

  // => frames
  public get bounds (): Rect {
    return Offset.ZERO.and(this.size)
  }

  // => size
  public get size (): Size {
    const size = Size.create(
      this.configuration.width, 
      this.configuration.height
    )
    return size
  }
  
  public rootTransform: Matrix4 | null = null
  public isRepaintBoundary: boolean = true

  /**
   * @param configuration 
   */
  constructor (configuration: ViewConfiguration) {
    super()

    this.configuration = configuration  
  }

  handleEvent (event: PointerEvent, entry: HitTestEntry): void {
    
  }

  prepareInitial () {
    invariant(this.owner !== null, `The "View.owner" cannot be null.`)
    invariant(this.rootTransform === null, `The "View.rootTransform" must be null.`)
    
    this.scheduleInitialLayout()
    this.scheduleInitialPaint(this.createNewRootLayer())
  }

  // 创建新绘制层
  createNewRootLayer (): TransformLayer {
    this.rootTransform = this.configuration.toMatrix()
    const root = TransformLayer.create(Offset.ZERO, this.rootTransform)    
    root.attach(this)

    return root
  }

  // 初始化
  scheduleInitialPaint (root: ContainerLayer) {
    invariant(this.attached)
    invariant(this.isRepaintBoundary)
    invariant(this.layerRef.layer === null)

    this.layerRef.layer = root

    invariant(this.needsPaint)
    this.owner?.objectsNeedingPaint.add(this)
  }

  scheduleInitialLayout () {
    invariant(this.attached, `The "this.attached" cannot be null.`)
    invariant(this.owner, `The "this.owner" cannot be null.`)
    invariant(this.relayoutBoundary === null, `The "this.relayoutBoundary" must be null.`)
    
    this.relayoutBoundary = this
    this.owner.objectsNeedingLayout.add(this)
  }

  performResize () {
    invariant(false)
  }
  
  performLayout () {
    invariant(this.rootTransform !== null, `The "View.rootTransform" cannot be null.`)

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
   * @param {PaintingContext} context 
   * @param {Offset} offset 
   */
  paint (context: PaintingContext, offset: Offset) {
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
    child: Object,
    transform: Matrix4
  ) {
    invariant(this.rootTransform !== null, `The "View.rootTransform" cannt be null.`)
    transform.multiply(this.rootTransform)
    super.applyPaintTransform(child, transform)
  }

  composite () {
    invariant(this.layer, `The  "View.layer" cannot be null.`)

    try {
      this.owner?.rasterizer.draw(LayerScene.create(this.layer).tree)
    } finally {
      // 
    }
  }

  hitTest (result: BoxHitTestResult, position: Offset) {
    if (this.child !== null) {
      this.child.hitTest(BoxHitTestResult.wrap(result), position)
    }

    result.add(HitTestEntry.create(this))
    return true
  }
}