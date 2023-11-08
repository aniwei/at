import { invariant } from '@at/utils'
import { AtLayoutParagraph } from '../at'
import { Offset, Rect, Size } from '../basic/geometry'
import { AtPaintingContext } from './painting-context'
import { AtPipelineOwner } from './pipeline-owner'
import { AtLayoutBox } from './box'
import { AtParagraphPainter } from './paragraph-painter'
import { AtBoxConstraints } from './box-constraints'


export class AtLayoutParagraphPaint extends AtLayoutBox {
  
  /**
   * 
   * @param painter 
   * @returns 
   */
  static create (painter: AtParagraphPainter) {
    return new AtLayoutParagraphPaint(painter)
  }

  // => isRepaintBoundary
  public isRepaintBoundary = true
    
  // => sizedByParent
  public sizedByParent = true
    
  // => painter
  private _painter: AtParagraphPainter | null
  public get painter (): AtParagraphPainter | null {
    return this._painter
  }
  public set painter (painter: AtParagraphPainter | null ) {
    if (painter !== this._painter) {
      
  
      if (painter?.shouldRepaint(this._painter) ?? true) {
        this.markNeedsPaint()
      }

      if (this.attached) {
        this._painter?.unsubscribe()
        painter?.subscribe(() => this.markNeedsPaint)
      }

      this._painter = painter
    }
  }

  // public left: number | null = null
  // public top: number | null = null
  // public right: number | null = null
  // public bottom: number | null = null
  // public width: number | null = null
  // public height: number | null = null
  // public scale: number | null = null
  // public size: Size | null = null
  
  constructor (painter: AtParagraphPainter) {
    super()
    this._painter = painter
  } 

  markNeedsPaint(): void {
    super.markNeedsPaint()
  }


  paint (context: AtPaintingContext, offset: Offset) {
    const parent = this.parent as AtLayoutParagraph
    invariant(parent !== null)
    invariant(this.size !== null)
    invariant(context.canvas)

    const painter = this.painter
    if (painter !== null && parent !== null) {
      parent.computeTextMetricsIfNeeded()
      painter.paint(context.canvas, this.size, parent)
    }
  }

  attach (owner: AtPipelineOwner) {
    super.attach(owner)
    this.painter?.subscribe(() => this.markNeedsPaint())
  }
  
  detach () {
    this.painter?.unsubscribe()
    super.detach()
  }

  computeDryLayout (constraints: AtBoxConstraints): Size {
    return constraints.biggest
  }
}