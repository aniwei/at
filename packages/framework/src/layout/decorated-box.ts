import { invariant } from '@at/utility'
import { Offset, Size } from '../basic/geometry'
import { AtImageConfiguration } from '../painting/image-provider'
import { AtLayoutBox } from './box'
import { AtPaintingContext } from './painting-context'
import { AtBoxDecoration, AtBoxDecorationCompositePainter } from '../painting/box-decoration'
import { AtLayoutStack, DecorationPosition } from '../at'

export type AtLayoutDecoratedBoxOptions = {
  decoration: AtBoxDecoration,
  position?: DecorationPosition,
  configuration?: AtImageConfiguration,
}

export class AtLayoutDecoratedBox extends AtLayoutStack {
  static create (options: AtLayoutDecoratedBoxOptions) {
    return new AtLayoutDecoratedBox(
      options.decoration,
      options?.position,
      options?.configuration,
    )
  }
  
  public painter: AtBoxDecorationCompositePainter | null = null

  constructor (
    decoration: AtBoxDecoration,
    position: DecorationPosition = DecorationPosition.Background,
    configuration: AtImageConfiguration = AtImageConfiguration.empty,
  ) {
    super()
    this._decoration = decoration
    this._position = position
    this._configuration = configuration
  }


  // => decoration
  private _decoration: AtBoxDecoration
  public get decoration () {
    return this._decoration
  }
  public set decoration (value: AtBoxDecoration) {
    if (this._decoration === null || this._decoration.notEqual(value)) {
      this.painter?.dispose()
      this.painter = null
      this._decoration = value
      this.markNeedsPaint()
    }
  }

  // => position
  private _position: DecorationPosition
  public get position () {
    return this._position
  }
  public set position (value: DecorationPosition) {
    if (this._position !== value) {
      this._position = value
      this.markNeedsPaint()
    }
  }
  // => configuration
  private _configuration: AtImageConfiguration
  public get configuration () {
    return this._configuration
  }
  public set configuration (value: AtImageConfiguration) {
    if (this._configuration === null || this._configuration.notEqual(value)) {
      this._configuration = value
      this.markNeedsPaint()
    }
  }

  detach () {
    this.painter?.dispose()
    this.painter = null
    super.detach()
    this.markNeedsPaint()
  }
  /**
   * 
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestSelf (position: Offset) {
    invariant(this.size !== null)
    invariant(this.configuration === null || this.configuration.textDirection !== null)
    return this.decoration.hitTest(
      this.size, 
      position, 
      this.configuration.textDirection
    )
  }

  paint (context: AtPaintingContext, offset: Offset) {
    this.painter ??= this.decoration.createPainter(() => this.markNeedsPaint())
    const filledConfiguration = this.configuration.copyWith()
    filledConfiguration.size = this.size
    
    if (this.position === DecorationPosition.Background) {
      invariant(context.canvas !== null)
      
      this.painter.paint(
        context.canvas, 
        this.decoration, 
        offset, 
        filledConfiguration.textDirection, 
        filledConfiguration
      )
     
      if (this.decoration.isComplex) {
        context.setIsComplexHint()
      }
    }

    super.paint(context, offset)
    
    if (this.position === DecorationPosition.Foreground) {
      invariant(context.canvas !== null)
      this.painter.paint(
        context.canvas, 
        this.decoration,
        offset, 
        filledConfiguration.textDirection, 
        filledConfiguration
      )
      if (this.decoration.isComplex) {
        context.setIsComplexHint()
      }
    }
  }
}