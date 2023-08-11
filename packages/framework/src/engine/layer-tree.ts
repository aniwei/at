import { Matrix4 } from '../basic/matrix4'
import { Color } from '../basic/color'
import { Rect, Size } from '../basic/geometry'
import { AtPaintContext, AtPrerollContext, AtRootLayer } from './layer'
import { AtRecorder } from './canvas'

import { AtNWCanvas } from './n-way-canvas'

import type { AtSurfaceFrame } from './surface'
import type { AtPicture } from './picture'


/**
 * 绘制层树
 */
export class AtLayerTree {
  static create (root: AtRootLayer) {
    return new AtLayerTree(root)
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
  preroll (frame: AtSurfaceFrame, ignoreCache: boolean = false) {
    const context: AtPrerollContext = new AtPrerollContext(ignoreCache ? null : frame.caches)
    this.root.preroll(context, Matrix4.identity())
  }

  /**
   * 绘制 
   * @param {AtFrame} frame
   * @param {boolean} ignoreCache
   * @return {void}
   */
  paint (frame: AtSurfaceFrame, ignoreCache: boolean = false): void {
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
   * @return {AtPicture}
   */
  flatten (): AtPicture {
    const recorder = new AtRecorder(Rect.largest)
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