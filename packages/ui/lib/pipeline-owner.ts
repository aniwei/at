import { invariant } from '@at/utils' 
import { Object } from './object'
import { PaintingContext } from './painting-context'
import { ViewConfiguration } from './view-configuration'

import type { Engine, EngineRasterizer } from '@at/engine'

//// => ObjectNeedingUpdate
export type RequestRasterizeHandle = () => void
export class ObjectNeedingUpdate extends Array<Object> {
  static create () {
    return new ObjectNeedingUpdate()
  }

  add (node: Object) {
    if (!this.includes(node)) {
      this.push(node)
    }
  }
}

export class PipelineOwner {
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

  // => needs
  public onNeedVisualUpdate: VoidFunction | null = null
  
  public instance: Engine
  public rasterizer: EngineRasterizer
  public configuration: ViewConfiguration

  public objectsNeedingLayout: ObjectNeedingUpdate = ObjectNeedingUpdate.create()
  public objectsNeedingPaint: ObjectNeedingUpdate = ObjectNeedingUpdate.create()
  public objectsNeedingCompositingBitsUpdate: ObjectNeedingUpdate = ObjectNeedingUpdate.create()
  
  constructor (
    instance: Engine,
    rasterizer: EngineRasterizer, 
    onNeedVisualUpdate: VoidFunction, 
    configuration: ViewConfiguration
  ) {
    this.instance = instance
    this.rasterizer = rasterizer
    this.configuration = configuration
    this.onNeedVisualUpdate = onNeedVisualUpdate
  }

  requestUpdate () {
    if (this.onNeedVisualUpdate) {
      this.onNeedVisualUpdate()
    }
  }

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

  enableMutationsToDirtySubtrees (callback: VoidFunction) {
   
  }
  
  flushCompositingBits () {
    this.objectsNeedingCompositingBitsUpdate.sort((a, b) => a.depth - b.depth)

    for (const node of this.objectsNeedingCompositingBitsUpdate) {
      if (node.needsCompositingBitsUpdate && node.owner === this) {
        node.updateCompositingBits()
      }
    }

    this.objectsNeedingCompositingBitsUpdate = ObjectNeedingUpdate.create()
  }
  
  flushPaint (): boolean {
    try {
      const dirtyNodes: Object[] = this.objectsNeedingPaint.sort((a: Object, b: Object) => {
        return b.depth - a.depth
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
    } finally {
    }
  }
}
