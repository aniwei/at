import { invariant } from '@at/utils' 
import { Object } from './object'
import { PaintingContext } from './painting-context'
import { ViewConfiguration } from './view-configuration'

import type { Engine, EngineRasterizer } from '@at/engine'

//// => ObjectNeedingUpdate
export interface RequestRasterizeHandle {
  (): void
}

export class ObjectNeedingUpdate {
  static create () {
    return new ObjectNeedingUpdate()
  }

  // => length
  public get length () {
    return this.objects.length
  }

  public objects: Object[] = []

  sort (compare: (a: Object, b: Object) => number) {
    return this.objects.sort(compare)
  }

  add (node: Object) {
    if (!this.objects.includes(node)) {
      this.objects.push(node)
    }
  }
}

export class PipelineOwner {
  /**
   * 创建 PipelineOwner 对象
   * @param {Engine} instance 
   * @param {EngineRasterizer} rasterizer 
   * @param {VoidFunction} onNeedVisualUpdate 
   * @param {ViewConfiguration} configuration 
   * @returns {PipelineOwner}
   */
  static create (
    instance: Engine,
    rasterizer: EngineRasterizer, 
    onNeedVisualUpdate: VoidFunction, 
    configuration: ViewConfiguration
  ) {
    return new PipelineOwner(
      instance,
      rasterizer, 
      onNeedVisualUpdate, 
      configuration
    )
  }


  // => devicePixelRatio
  public get devicePixelRatio () {
    return this.configuration.devicePixelRatio
  }

  // => root
  protected _root: Object | null = null
  public get root () {
    return this._root
  }
  public set root (root: Object | null) {
    if (this.root !== root) {
      this._root?.detach()

      this._root = root
      this._root?.attach(this)
    }
  }

  // 上屏回调
  public onNeedVisualUpdate: VoidFunction | null = null
  // 应用实例
  public engine: Engine
  // 光栅器
  public rasterizer: EngineRasterizer
  // 配置
  public configuration: ViewConfiguration

  // 布局节点
  public objectsNeedingLayout: ObjectNeedingUpdate = ObjectNeedingUpdate.create()
  // 绘制节点
  public objectsNeedingPaint: ObjectNeedingUpdate = ObjectNeedingUpdate.create()
  // 合成节点
  public objectsNeedingCompositingBitsUpdate: ObjectNeedingUpdate = ObjectNeedingUpdate.create()
  
  constructor (
    engine: Engine,
    rasterizer: EngineRasterizer, 
    onNeedVisualUpdate: VoidFunction, 
    configuration: ViewConfiguration
  ) {
    this.engine = engine
    this.rasterizer = rasterizer
    this.configuration = configuration
    this.onNeedVisualUpdate = onNeedVisualUpdate
  }

  /**
   * 请求更新
   */
  requestUpdate () {
    if (this.onNeedVisualUpdate) {
      this.onNeedVisualUpdate()
    }
  }

  /**
   * 处理布局
   */
  flushLayout () {
    try {
      while (this.objectsNeedingLayout.length > 0) {
        const dirtyNodes = this.objectsNeedingLayout.sort((a: Object, b: Object) => {
          return a.depth - b.depth
        })
        
        this.objectsNeedingLayout = ObjectNeedingUpdate.create()
        for (const node of dirtyNodes) {
          if (node.needsLayout && node.owner === this) {
            node.layoutWithoutResize()
          }
        }
      }
    } finally {

    }
  }
  
  /**
   * 处理合成节点
   */
  flushCompositingBits () {
    this.objectsNeedingCompositingBitsUpdate.sort((a, b) => a.depth - b.depth)

    for (const node of this.objectsNeedingCompositingBitsUpdate.objects) {
      if (node.needsCompositingBitsUpdate && node.owner === this) {
        node.updateCompositingBits()
      }
    }

    this.objectsNeedingCompositingBitsUpdate = ObjectNeedingUpdate.create()
  }
  
  /**
   * 绘制
   * @returns {boolean}
   */
  flushPaint (): boolean {
    try {
      const dirtyNodes: Object[] = this.objectsNeedingPaint.sort((a: Object, b: Object) => {
        return b.depth > a.depth ? -1 : 1
      })

      this.objectsNeedingPaint = ObjectNeedingUpdate.create()

      for (const node of dirtyNodes) {
        invariant(node.layerRef.layer !== null, `The "node.layerRef.layer" cannot be null.`)
        
        if (node.needsPaint && node.owner === this) {
          if (node.layerRef.layer.attached) {
            PaintingContext.repaintCompositedChild(node)
          } else {
            node.skippedPaintingOnLayer()
          }
        }
      }

      return dirtyNodes.length > 0
    } catch (error: any) {
      throw error
    } finally {
      return false
    }
  }
}
