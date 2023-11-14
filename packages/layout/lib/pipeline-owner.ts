import { invariant } from '@at/utils' 
import { Object, VoidCallback } from './object'
import { AtPaintingContext } from './painting-context'
import { AtViewConfiguration } from './view'
import type { AtRasterizer } from '../engine/rasterizer'

export type RequestRasterizeCall = () => void

export class AtNodesNeedingUpdate extends Array<AtLayoutObject> {
  static create () {
    return new AtNodesNeedingUpdate()
  }
  add (node: AtLayoutObject) {
    if (!this.includes(node)) {
      this.push(node)
    }
  }
}

export class PipelineOwner {
  static create (rasterizer: AtRasterizer, onNeedVisualUpdate: VoidCallback, configuration: AtViewConfiguration) {
    return new PipelineOwner(rasterizer, onNeedVisualUpdate, configuration)
  }

  // => root
  private _root: AtLayoutObject | null = null
  public get root () {
    return this._root
  }
  public set root (root: AtLayoutObject | null) {
    if (this.root !== root) {
      this._root?.detach()

      this._root = root
      this._root?.attach(this)
    }
  }

  // => needs

  public onNeedVisualUpdate: VoidCallback | null = null
  
  public rasterizer: AtRasterizer
  public configuration: AtViewConfiguration
  public nodesNeedingLayout: AtNodesNeedingUpdate = AtNodesNeedingUpdate.create()
  public nodesNeedingPaint: AtNodesNeedingUpdate = AtNodesNeedingUpdate.create()
  public nodesNeedingCompositingBitsUpdate: AtNodesNeedingUpdate = AtNodesNeedingUpdate.create()
  
  constructor (rasterizer: AtRasterizer, onNeedVisualUpdate: VoidCallback, configuration: AtViewConfiguration) {
    this.onNeedVisualUpdate = onNeedVisualUpdate
    this.configuration = configuration
    this.rasterizer = rasterizer
  }

  requestUpdate () {
    if (this.onNeedVisualUpdate) {
      this.onNeedVisualUpdate()
    }
  }

  flushLayout () {
    try {
      while (this.nodesNeedingLayout.length > 0) {
        const dirtyNodes = this.nodesNeedingLayout.sort((a: AtLayoutObject, b: AtLayoutObject) => {
          return a.depth - b.depth
        })
        
        this.nodesNeedingLayout = AtNodesNeedingUpdate.create()
        for (const node of dirtyNodes) {
          if (node.needsLayout && node.owner === this) {
            node.layoutWithoutResize()
          }
        }
      }
    } finally {
    }
  }

  enableMutationsToDirtySubtrees (callback: VoidCallback) {
   
  }
  
  flushCompositingBits () {
    this.nodesNeedingCompositingBitsUpdate.sort((a, b) => a.depth - b.depth)

    for (const node of this.nodesNeedingCompositingBitsUpdate) {
      if (node.needsCompositingBitsUpdate && node.owner === this) {
        node.updateCompositingBits()
      }
    }

    this.nodesNeedingCompositingBitsUpdate = AtNodesNeedingUpdate.create()
  }
  
  flushPaint (): boolean {
    try {
      const dirtyNodes: AtLayoutObject[] = this.nodesNeedingPaint.sort((a: AtLayoutObject, b: AtLayoutObject) => {
        return b.depth - a.depth
      })

      this.nodesNeedingPaint = AtNodesNeedingUpdate.create()

      for (const node of dirtyNodes) {
        invariant(node.layerHandle.layer !== null, `The "node.layerHandle.layer" cannot be null.`)
        if (node.needsPaint && node.owner === this) {
          if (node.layerHandle.layer.attached) {
            AtPaintingContext.repaintCompositedChild(node)
            break
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
