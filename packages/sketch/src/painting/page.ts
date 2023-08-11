import { Layer, LayerFrame, LayerStyle, LayerTypes } from './layer'

export interface PageStyle extends LayerStyle<PageStyle> {}
export class Page extends Layer<Page, PageStyle> {
  constructor (
    id: string,
    name: string,
    frame: LayerFrame
  ) {
    super(id, name, frame, LayerTypes.Page)
  }

  paint () {}
}