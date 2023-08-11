import { Layer, LayerFrame, LayerStyle, LayerTypes } from './layer'

export interface FillStyle extends LayerStyle<FillStyle> {}
export class Fill extends Layer<Fill, FillStyle> {
  constructor (
    id: string,
    name: string,
    frame: LayerFrame
  ) {
    super(id, name, frame, LayerTypes.Page)
  }

  paint () {}
}