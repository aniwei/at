import { Layer, LayerFrame, LayerStyle, LayerTypes } from './layer'

export interface TextStyle extends LayerStyle<TextStyle> {
  alignment: number,
  verticalAlignment: number,
  underline: number,
  fontFamily: string,
  fontSize: number
}

export class Text extends Layer<Text, TextStyle> {
  public content: string

  constructor (
    id: string,
    name: string,
    frame: LayerFrame,
    content: string
  ) {
    super(id, name, frame, LayerTypes.Text)
    this.content = content
  }

  paint (): void {
       
  }
}