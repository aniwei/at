import { Layer, LayerFrame, LayerStyle, LayerTypes } from './layer'

export interface ArtboardStyle extends LayerStyle<ArtboardStyle> {}

export class Artboard extends Layer<Artboard, ArtboardStyle> {
  constructor (
    id: string,
    name: string,
    frame: LayerFrame
  ) {
    super(id, name, frame, LayerTypes.Artboard)
  }

  paint () {}
}