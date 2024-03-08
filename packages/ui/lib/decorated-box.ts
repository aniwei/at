import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { 
  BoxDecoration, 
  ImageConfiguration, 
  BoxDecorationCompositePainter 
} from '@at/painting'
import { 
  Canvas 
} from '@at/engine'
import { Box } from './box'
import { PaintingContext } from './painting-context'
import { BoxHitTestResult } from '.'


// => DecorationPosition
export enum DecorationPosition {
  Background,
  Foreground,
}

//// => DecoratedBox
export interface DecoratedBoxOptions {
  child?: Box,
  decoration: BoxDecoration,
  position?: DecorationPosition.Background,
  configuration?: ImageConfiguration
}

export class DecoratedBox extends Box {
  static create (options: DecoratedBoxOptions) {
    return new DecoratedBox(
      options.child,
      options.decoration,
      options.position,
      options.configuration,
    )
  }

  // => decoration
  // 装饰器
  protected  _decoration: BoxDecoration | null = null
  public get decoration () {
    invariant(this._decoration !== null, 'The "DecoratedBox.decoration" cannot be null')
    return this._decoration
  }
  public set decoration (decoration: BoxDecoration) {
    invariant(decoration !== null, 'The argument "decoration" cannot be null.')
    if (decoration !== this._decoration) {
      this.painter?.dispose()
      this._painter = null

      this._decoration = decoration
      this.markNeedsPaint()
    }
  }

  // => position
  // 绘制位置
  protected _position: DecorationPosition = DecorationPosition.Background
  public get position () {
    return  this._position
  }
  public set position (position: DecorationPosition) {
    invariant(position !== null, 'The argument "position" cannot be null.')

    if (position !== this._position) {
      this._position = position
      this.markNeedsPaint()
    }   
  }

  // => configuration
  protected _configuration: ImageConfiguration =  ImageConfiguration.EMPTY
  public get configuration  () {
    return this._configuration
  }
  public set configuration (configuration: ImageConfiguration) {
    invariant(configuration !== null, 'The argument "configuration" camnot be null.')

    if (this._configuration.notEqual(configuration)) {
      this._configuration = configuration
      this.markNeedsPaint()
    }  
  }

  // => painter
  protected _painter: BoxDecorationCompositePainter | null = null
  public get painter () {
    if (this._painter === null) {
      this._painter ??= this.decoration.createPainter(() => this.markNeedsPaint()) ?? null
    }

    return this._painter
  }
  
  constructor (
    child: Box | null = null,
    decoration: BoxDecoration,
    position: DecorationPosition = DecorationPosition.Background,
    configuration: ImageConfiguration = ImageConfiguration.EMPTY,
  ) {
    super([child])
    
    this.decoration = decoration
    this.position = position
    this.configuration = configuration
  }

  /**
   * 绘制
   * @param {PaintingContext} context 
   * @param {Offset} offset 
   */
  paint (context: PaintingContext, offset: Offset) {
    invariant(this.size, 'The "DecoratedBox.size" cannot be null.')
    invariant(this.painter !== null, 'The "DecoratedBox.painter" cannot be null.') 
    
    const configuration = this.configuration.copyWith()
    configuration.size = this.size

    if (this.position === DecorationPosition.Background) {
      this.painter.paint(
        context.canvas as Canvas, 
        this.decoration,
        offset, 
        this.configuration.textDirection,
        configuration
      )
      
      if (this.decoration.isComplex) {
        context.setIsComplexHint()
      }
    }

    this.defaultPaint(context, offset)
    
    if (this.position == DecorationPosition.Foreground) {
      this.painter.paint(
        context.canvas as Canvas, 
        this.decoration,
        offset, 
        this.configuration.textDirection,
        configuration
      )

      if (this.decoration.isComplex) {
        context.setIsComplexHint()
      }
    }
  }

  /**
   * 子节点碰撞测试
   * @param {BoxHitTestResult} result 
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestChildren (result: BoxHitTestResult, position: Offset): boolean {
    return this.defaultHitTestChildren(result, position)
  }

  /**
   * 碰撞测试
   * @param {Offset} position 
   * @returns {boolean}
   */
  hitTestSelf (position: Offset): boolean {
    invariant(this.size !== null, 'The "DecoratedBox.size" cannot be null.')
    return this.decoration.hitTest(
      this.size, 
      position, 
      this.configuration.textDirection
    )
  }

  /**
   * 卸载
   */
  detach () {
    this.painter?.dispose()
    this._painter = null
    super.detach()
    this.markNeedsPaint()
  }
}
