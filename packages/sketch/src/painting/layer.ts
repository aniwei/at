
import { Rect } from '@at/engine/geometry'
import { PaintStyle, StrokeCap, StrokeJoin } from '@at/engine/skia'
import { At } from '../../at'
import { Fill } from './fill'
import { Border } from './border'

export interface LayerFrame {
  x: number,
  y: number,
  width: number,
  height: number
}

export interface LayerColor {
  red: number,
  green: number,
  blue: number,
  alpha: number
}

export interface LayerGradientStyle {
  from: {},
  to: {},
  stops: []
}

export interface LayerStyleContext {}

export interface LayerPaintStyle {
  fillType: PaintStyle,
  thickness: number,
  context: LayerStyleContext,
  strokeCap: StrokeCap,
  strokeJoin: StrokeJoin,
  pattern: [],
  image: {

  },
  gradient: LayerGradientStyle
}

export interface LayerBorderStyle {
  fillType: PaintStyle,
  thickness: number,
  context: LayerStyleContext,
  strokeCap: StrokeCap,
  strokeJoin: StrokeJoin,
  pattern: [],
  miterLimit: number,
}

export interface LayerShadowStyle {
  blurRadius: number,
  color: LayerColor,
  offsetX: number
  offsetY: number
  spread: number
}

export interface BaseLayerStyle {
  rotation: number,
  fills: LayerPaintStyle[],
  borders: LayerBorderStyle[],
  shadows: LayerShadowStyle[]
  context: LayerStyleContext,
}

export enum LayerTypes {
  Artboard,
  Border,
  Fill,
  Group,
  Image,
  Page,
  Path,
  Rectangle,
  Text,
}

export abstract class BaseLayer extends Rect {
  public id: string
  public name: string
  public type: LayerTypes
  
  public style: BaseLayerStyle

  public visible: boolean = true
  public isLocked: boolean = false

  public firstLayer: BaseLayer | null = null
  public lastLayer: BaseLayer | null = null

  public previsouLayer: BaseLayer | null = null
  public nextLayer: BaseLayer | null = null

  constructor (
    id: string,
    name: string,
    frame: LayerFrame,
    type: LayerTypes,
  ) {
    super(
      frame.x,
      frame.y,
      frame.x + frame.width,
      frame.y + frame.height
    )

    this.id = id
    this.name = name
    this.type = type
    this.style = {
      rotation: 0,
      fills: [],
      borders: [],
      shadows: [],
      context: {
        blendMode: At.BlendMode.Clear,
        opacity: 1,
      }
    }
  }

  append (childLayer: BaseLayer) {
    
  }

  detach () {

  }
}


export interface LayerStyle<T extends LayerStyle<T> = BaseLayerStyle> {}

export abstract class Layer<
  T extends BaseLayer = BaseLayer, 
  S extends LayerStyle<S> = BaseLayerStyle
> extends BaseLayer {
  abstract paint (): void
}
