import { Layer, LayerFrame, LayerStyle, LayerTypes } from './layer'

export interface BorderStyle extends LayerStyle<BorderStyle> {}
export class Border extends Layer<Border, BorderStyle> {
  constructor (
    id: string,
    name: string,
    frame: LayerFrame
  ) {
    super(id, name, frame, LayerTypes.Page)
  }

  paint () {}
}