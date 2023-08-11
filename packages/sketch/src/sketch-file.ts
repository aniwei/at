
import JSZip from 'jszip'
import zip from 'jszip'
import { Page } from './painting/page'
import { BaseLayer } from './painting/layer'


export interface Meta { }
export interface User {}
export interface Document { }


export interface Layer<T extends Layer<T, S>, S extends LayerStyle<S> > {
  name: string,
  frame: {
    x: number,
    y: number,
    width: number,
    height: number
  },
  style: LayerStyle<S>,
  rotation: number,
  _class: string | 'page',
  layers: Layer<T, S>[]
}


export interface FillStyle {

}

export interface BorderStyle {

}

export interface LayerStyle<T extends LayerStyle<T>> {
  fills: FillStyle[],
  borders: BorderStyle[]
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





export class SketchFileSystem {
  static readFromBytes (data: ArrayBuffer): Promise<SketchFileSystem> {
    return zip.loadAsync(data).then((zip: JSZip) => {
      return new SketchFileSystem(zip)
    })
  }

  private zip: JSZip

  constructor (zip: JSZip) {
    this.zip = zip
  }

  readJSON (path: string) {
    return this.zip.file(path)?.async('string').then(data => JSON.parse(data))
  }

  readFile (path: string) {
    return this.zip.file(path)?.async('arraybuffer')
  }
}

export class SketchFileParser {
  static async parseFromBytes (data: ArrayBuffer): Promise<SketchFileParser> {
    return SketchFileSystem.readFromBytes(data).then((fs: SketchFileSystem) => {
      return Promise.all([
        fs.readJSON('meta.json'),
        fs.readJSON('user.json'),
        fs.readJSON('document.json'),
      ]).then(([meta, user, document]) => {
        return new SketchFileParser(fs, meta, user, document)      
      })
    })
  }

  private fs: SketchFileSystem
  private user
  private meta
  private document

  constructor (fs: SketchFileSystem, meta, user, document) {
    this.fs = fs
    this.meta = meta
    this.user = user
    this.document = document
  }

  async parse () {

  } 
}