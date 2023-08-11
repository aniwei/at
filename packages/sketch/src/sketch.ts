
import jszip from 'jszip'
import { Page } from './painting/page'
import { BaseLayer } from './painting/layer'


export interface SketchMeta { }

export interface SketchDocument { }

export interface SketchUser {}

export interface SketchFillStyle {

}

export interface SketchBorderStyle {

}

export interface SketchStyle<T extends SketchStyle<T>> {
  fills: SketchFillStyle[],
  borders: SketchBorderStyle[]
}

export interface SketchLayerStyle extends SketchStyle<SketchLayerStyle> {

}

export interface SketchSchema<T extends SketchSchema<T>> {
  name: string,
  frame: {
    x: number,
    y: number,
    width: number,
    height: number
  },
  style: SketchLayerStyle,
  rotation: number,
  _class: string | 'page',
}

export interface SketchLayer extends SketchSchema<SketchLayer> {
  layers: SketchLayer[]
}


function createLayer (id: string, schema: SketchLayer) {
  let layer: BaseLayer | null = null

  if (schema._class === 'page') {
     layer =  new Page(id, schema.name, schema.frame)
  } else if (schema._class === '') {

  } else if (schema._class === '') {

  }

  if (layer) {
    layer.style.rotation = schema.rotation
    // layer.style.fills = schema.style.fills
  }

  if (schema.layers) {
    const layers = schema.layers

    if (layers.length > 0) {
      for (const schema of layers) {
        const childLayer = createLayer(``, schema) as BaseLayer
        layer?.append(childLayer)
      }
    }
  }

  return layer
}

export class Sketch {
  static async from (data: ArrayBuffer): Promise<Sketch> {
    return jszip.loadAsync(data).then(zip => {
      const readFile = (path: string) => {
        return zip.file(path)?.async('string').then(data => JSON.parse(data))
      }

      return Promise.all([
        readFile('meta.json'),
        readFile('user.json'),
        readFile('document.json')
      ]).then(async (files) => {
        const [meta, user, document] = files
        const pages = await Promise.all(Object.entries(meta.pagesAndArtboards).map(([id]) => {
          return readFile(`pages/${id}`)?.then(page => {
            return createLayer(id, page)
          })
        }))

        return new Sketch(document, pages as Page[])
      })
    })
  } 

  public pages: Page[]

  private document: SketchDocument

  constructor (document: SketchDocument, pages: Page[]) {
    this.pages = pages
    this.document = document
  }

}