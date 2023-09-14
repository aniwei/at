export enum AtSchemaType {
  Document = `DOCUMENT`,
  Board = `BOARD`,
  Frame = `FRAME`,
  Rectangle = `RECTANGLE`,
  Text = `TEXT`
}

export enum AtSchemaFillType {
  Image = `IMAGE`,
  Solid = `SOLID`
}

export enum AtSchemaBlendMode {
  Normal = `NORMAL`
}

export type AtSchemaColor = {
  r: number,
  g: number,
  b: number,
}

export type AtSchemaFill = {
  type: AtSchemaFillType,
  visible: boolean,
  opacity: number,
  blendMode: AtSchemaBlendMode,
  color: AtSchemaColor
}

export type AtSchema<T extends AtSchema<T>> = {
  type: AtSchemaType,
  fills: AtSchemaFill[]
}