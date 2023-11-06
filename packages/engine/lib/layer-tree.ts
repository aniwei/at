import { Matrix4 } from '@at/math'
import { Color } from '@at/basic'
import { Rect, Size } from '@at/geometry'
import { AtPaintContext, AtPrerollContext, AtRootLayer } from './layer'
import { Recorder } from './canvas'

import { AtNWCanvas } from './n-way-canvas'

import type { SurfaceFrame } from './surface'
import type { Picture } from './picture'


/**
 * 绘制层树
 */
export class LayerTree {
  static create (root: AtRootLayer) {
    return new LayerTree(root)
  }

  public root: AtRootLayer
  public devicePixelRatio: number | null = null
  public frame: Size = new Size(600, 600)

  /**
   * 构造函数
   * @param {AtRootLayer} rootLayer
   * @return {*}
   */  
  constructor (root: AtRootLayer) {
    this.root = root
  }
  
  /**
   * @description: 
   * @param {Frame} frame
   * @param {boolean} ignoreCache
   * @return {void}
   */
  preroll (frame: SurfaceFrame, ignoreCache: boolean = false) {
    const context: AtPrerollContext = new AtPrerollContext(ignoreCache ? null : frame.caches)
    this.root.preroll(context, Matrix4.identity())
  }

  /**
   * 绘制 
   * @param {AtFrame} frame
   * @param {boolean} ignoreCache
   * @return {void}
   */
  paint (frame: SurfaceFrame, ignoreCache: boolean = false): void {
    const nw = AtNWCanvas.create()
    nw.push(frame.canvas)
    nw.clear(new Color(0x00000000))

    const context = AtPaintContext.create(nw, frame.canvas, ignoreCache ? null : frame.caches)
    
    if (this.root.paintable) {
      this.root.paint(context)
    }
  }


  /**
   * 
   * @return {Picture}
   */
  flatten (): Picture {
    const recorder = Recorder.create(Rect.LARGEST)
    const prerollContext: AtPrerollContext = new AtPrerollContext(null)
    
    this.root.preroll(prerollContext, Matrix4.identity())

    const nw: AtNWCanvas = new AtNWCanvas()
    nw.push(recorder)

    const paintContext = new AtPaintContext(nw, recorder, null)

    if (this.root.paintable) {
      this.root.paint(paintContext)
    }

    return recorder.stop()
  }
}