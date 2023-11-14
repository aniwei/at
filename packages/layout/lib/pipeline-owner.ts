import { invariant } from '@at/utils' 
import type { AtRasterizer } from '@at/engine'
import { Object } from './object'
import { AtPaintingContext } from './painting-context'
import { AtViewConfiguration } from './view'

export type RequestRasterizeCall = () => void

export class AtNodesNeedingUpdate extends Array<Object> {
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
  static create (
    rasterizer: AtRasterizer, 
    onNeedVisualUpdate: VoidFunction, 
    configuration: AtViewConfiguration
  ) {
    return new PipelineOwner(
      rasterizer, 
      onNeedVisualUpdate, 
      configuration
    )
  }

  // => root
  private _root: Object | null = null
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
  
  public rasterizer: AtRasterizer
  public configuration: AtViewConfiguration
  public nodesNeedingLayout: AtNodesNeedingUpdate = AtNodesNeedingUpdate.create()
  public nodesNeedingPaint: AtNodesNeedingUpdate = AtNodesNeedingUpdate.create()
  public nodesNeedingCompositingBitsUpdate: AtNodesNeedingUpdate = AtNodesNeedingUpdate.create()
  
  constructor (rasterizer: AtRasterizer, onNeedVisualUpdate: VoidFunction, configuration: AtViewConfiguration) {
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
        const dirtyNodes = this.nodesNeedingLayout.sort((a: Object, b: Object) => {
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

  enableMutationsToDirtySubtrees (callback: VoidFunction) {
   
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
      const dirtyNodes: Object[] = this.nodesNeedingPaint.sort((a: Object, b: Object) => {
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
