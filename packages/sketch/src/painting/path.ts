import { PathOp } from '@at/engine/skia'
import { Layer, LayerFrame, LayerStyle, LayerTypes } from './layer'

export interface CurvePoint {
  cornerRadius: number,
  cornerStyle: number,
}


export interface PathStyle extends LayerStyle<PathStyle> {
  alignment: number,
  verticalAlignment: number,
  underline: number,
  fontFamily: string,
  fontSize: number
}

export class Path extends Layer<Path, PathStyle> {
  public boolean: PathOp
  public closed: boolean
  public points: CurvePoint[] = []

  constructor (
    id: string,
    name: string,
    frame: LayerFrame,
    boolean: PathOp,
    closed: boolean,
    points:  CurvePoint[]
  ) {
    super(id, name, frame, LayerTypes.Path)
    this.boolean = boolean
    this.closed = closed,
    this.points = points
  }

  paint () {
    
  }
}

export class Rectangle extends Path {
  paint () {
    
  }
}