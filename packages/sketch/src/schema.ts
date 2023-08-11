import jszip from 'jszip'
import { Rect } from './geometry'

export type Meta = {

}

export type Document = {

}

export type User = {

}

// => basic
export type SchemaFrame = {
  x: number,
  y: number,
  width: number,
  height: number
}

export type SchemaColor = {
  red: number,
  green: number,
  blue: number,
  alpha: number
}

export enum SketchLayerClass {
  Page = '_page',
  Artboard = '_artboard',
  Group = '_group'
}

export interface SketchStyle {
  blur: {},
  borders: [],
  fills: [],
  shadows: [],
  miterLimit: number
}

export interface SketchLayer {
  name: string,
  frame: SchemaFrame,
  style: SchemaStyle,
  rotation: number,
  isVisible: boolean,
  isLocked: boolean,
  clippingMaskMode: number,
  backgroundColor: SchemaColor,
  layers: SketchLayer[],
  class: SketchLayerClass
}


export enum ClippingMaskMode {

}

export enum SchemaTypes {
  Page = 'page',
  Artboard = 'artboard',
  Group = 'group'
}

export type SchemaStyle = {
  backgroundColor: SchemaColor | null,
  rotation: number,
  fills: [],
  borders: [],
  shadows: []
}

interface SchemaLayer {
  id: string
  name: string
  frame: SchemaFrame,
  type: SchemaTypes
  style: SchemaStyle
  visible: boolean
  locked: boolean
  children: Layer[] 
}

function createLayer (id, data) {
  
}

export class Schema {
  private meta: Meta
  private user: User
  private document: Document
  public pages: Layer[]

  static async fromArrayBuffer (content: ArrayBuffer): Promise<Schema> {
    return jszip.loadAsync(content).then((zip) => {
      return Promise.all([
        zip.file('meta.json')?.async('string').then(meta => JSON.parse(meta)),
        zip.file('user.json')?.async('string').then(user => JSON.parse(user)),
        zip.file('document.json')?.async('string').then(document => JSON.parse(document)),
      ]).then(async ([meta, user, document]) => {
        const pages = await Promise.all(Object.entries(meta.pagesAndArtboards).map(([id]) => {
          return zip
            .file(`pages/${id}.json`)?.async('string')
            .then(page => JSON.parse(page))
            .then(data => createLayer(id, data))
        }))

        const schema = new Schema(
          meta as Meta, 
          user as User, 
          pages as Array<Layer>,
          document as Document,
        )
        return schema
      })
    })
  }

  constructor (meta: Meta, user: User, pages: Layer[], document: Document) {
    this.meta = meta
    this.user = user
    this.pages = pages
    this.document = document
    
  }
}