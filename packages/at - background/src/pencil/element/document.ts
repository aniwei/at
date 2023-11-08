
import invariant from '@at/utils'
import { At, Color, Size, AtView, Subscribable } from '@at/framework'
import { AtPage } from './page'
import { AtStage } from './stage'
import { AtBoard } from './board'
import { AtElement } from './element'
import { AtFrame } from './frame'
import { AtRectangle } from './rectangle'
import { AtText } from './text'
import { AtPencilConfiguation, AtPencilConfiguationJSON, AtPencilConfiguationOptions } from '../pencil'
import { AtGroup } from './group'
import { AtShape } from './shape'


export enum ElementType {
  Document = `DOCUMENT`,
  Board = `BOARD`,
  Frame = `FRAME`,
  Group = `GROUP`,
  Image = `IMAGE`,
  Page = `PAGE`,
  Rectangle = `RECTANGLE`,
  Shape = `SHAPE`,
  Text = `TEXT`
}

export type AtDocumentThemeStyle = {
  highlightColor: Color,
  layerBackgroundColor: Color,
  layerHighlightColor: Color,
  layerBorderColor: Color,
  layerBorderWidth: number,
  layerAnchorBorderColor: Color,
  layerAnchorColor: Color,
  layerAnchorWidth: number,
}

export type AtDocumentConfigurationOptions = {
  theme?: AtDocumentThemeStyle | null,
  zoom?: number,
  version?: string
} & AtPencilConfiguationOptions

export type AtDocumentConfigurationJSON = {
  theme: {
    highlightColor: number[],
    layerHighlightColor: number[],
    layerBackgroundColor: number[],
    layerBorderColor: number[],
    layerBorderWidth: number,
    layerAnchorBorderColor: number[]
    layerAnchorColor: number[],
    layerAnchorWidth: number
  }
} & AtPencilConfiguationJSON

export class AtDocumentConfiguration extends AtPencilConfiguation {
  static create (options: AtDocumentConfigurationOptions) {
    return new AtDocumentConfiguration(
      options.size,
      options.devicePixelRatio,
      options.baseURL,
      options.assetsDir,
      options.theme,
      options.version,
      options.zoom,
    )
  }

  static fromJSON (json: AtDocumentConfigurationJSON) {
    return AtDocumentConfiguration.create({
      size: Size.create(json.size[2], json.size[3]),
      devicePixelRatio: json.devicePixelRatio,
      baseURL: json.baseURL,
      assetsDir: json.assetsDir,
      theme: {
        highlightColor: Color.fromRGBO(...json.theme.highlightColor),
        layerHighlightColor: Color.fromRGBO(...json.theme.layerHighlightColor),
        layerBackgroundColor: Color.fromRGBO(...json.theme.layerBackgroundColor),
        layerBorderColor: Color.fromRGBO(...json.theme.layerBorderColor),
        layerBorderWidth: json.theme.layerBorderWidth,
        layerAnchorBorderColor: Color.fromRGBO(...json.theme.layerAnchorBorderColor),
        layerAnchorColor: Color.fromRGBO(...json.theme.layerAnchorColor),
        layerAnchorWidth: json.theme.layerAnchorWidth
      }
    })
  }

  private _theme: AtDocumentThemeStyle | null = null
  public get theme () {
    return this._theme
  }
  public set theme (theme) {
    if (this._theme === null || this._theme !== theme) {
      this._theme = theme
    }
  }

  public zoom: number
  public version: string

  constructor (
    size: Size = Size.zero, 
    devicePixelRatio: number = 2.0,
    baseURL: string,
    assetsDir: string,
    theme: AtDocumentThemeStyle | null = null,
    version: string = `1.0.0`,
    zoom: number = 1.0,
  ) {
    super(size, devicePixelRatio, baseURL, assetsDir)

    this.zoom = zoom
    this.theme = theme
    this.version = version
  }

  copyWith (
    size: Size | null = null, 
    devicePixelRatio: number | null = null, 
    baseURL: string | null = null,
    assetsDir: string | null = null,
    theme: AtDocumentThemeStyle | null = null,
    version: string | null = null,
    zoom: number | null = null,
  ) {
    return AtDocumentConfiguration.create({
      size: size ?? this.size,
      devicePixelRatio: devicePixelRatio ?? this.devicePixelRatio,
      baseURL: baseURL ?? this.baseURL,
      assetsDir: assetsDir ?? this.assetsDir,
      theme: theme ?? this.theme,
      version: version ?? this.version,
      zoom: zoom ?? this.zoom,
    })
  }

  eqaul (configuration: AtDocumentConfiguration | null) {
    return (
      super.equal(configuration) &&
      this.zoom === configuration?.zoom && 
      this.version === configuration?.version 
    )
  }

  toJSON () {
    return {
      ...super.toJSON(),
      theme: this.theme,
      version: this.version,
      zoom: this.devicePixelRatio
    }
  }
}

export class AtDoucmentPages extends Subscribable {
  private _active: AtPage | null = null
  public get active () {
    return this._active
  }
  public set active (page: AtPage | null) {
    if (this._active === null || this._active !== page) {
      this._active = page
      this.publish()
    }
  }

  public pages: AtPage[] = []

  add (page: AtPage) {
    if (!this.pages.includes(page)) {
      this.pages.push(page)

      this.active ??= page
    }
  }

  remove (page: AtPage) {
    if (this.pages.includes(page)) {
      const index = this.pages.findIndex((p: AtPage) => {
        return p === page
      })

      if (index > -1) {
        this.pages.splice(index, 1)
      }

      if (page === this.active) {
        this.active = this.pages[0] ?? null
      }
    }
  }
}

export type AtDocumentOptions = {
  id: string, 
  name?: string,
  configuration: AtDocumentConfiguration,
}

export class AtDocument extends AtView {
  static create (options: AtDocumentOptions) {
    return new AtDocument(
      options.id, 
      options.name,
      options.configuration
    )
  }

  static async fromURL (
    uri: string, 
    configuration: AtDocumentConfiguration
  ) {
    return At.fetch(uri)
      .then(res => res.json())
      .then((schema: AtDocumentSchema) => {
        const version = schema.version
        const zoom = schema.configuration.zoom

        configuration = configuration.copyWith(
          configuration.size,
          configuration.devicePixelRatio,
          configuration.baseURL,
          configuration.assetsDir,
          configuration.theme,
          version,
          zoom
        )

        const document: AtDocument = createDocumentBySchemaAndConfiguration(
          schema,
          configuration
        )

        if (document.pages.length > 0) {
          document.current = document.pages[0]
        }

        return document
      })
  }

  static createElement <T extends AtElement> (
    type: ElementType
  ): T | null {
    let element: unknown | null = null
  
    switch (type) {
      case ElementType.Page: {
        element = AtPage.create({ id, name })
        break
      }

      case ElementType.Board: {
        element = AtBoard.create({ id, name })
        break
      }
  
      case ElementType.Frame: {
        element = AtFrame.create({ id, name })
        break
      }

      case ElementType.Group: {
        element = AtGroup.create({ id, name })
        break
      }

      case ElementType.Shape: {
        element = AtShape.create({ id, name })
        break
      }
  
      case ElementType.Rectangle: {
        element = AtRectangle.create({ id, name })
        break
      }
  
      case ElementType.Text: {
        element = AtText.create({ id, name })
        break
      }
    }
  
    return element as T
  }

  static getElementById (id: string): AtElement | null {
    return null
  }

  // => configuration
  public get configuration () {
    return super.configuration as AtDocumentConfiguration
  }
  public set configuration (value: AtDocumentConfiguration) {
    if (this._configuration === null || this._configuration.notEqual(value)) {
      this._configuration = value
      const theme = value.theme
      if (theme !== null) {
        this.stage = AtStage.create({
          size: value.size,
          anchorColor: theme.layerAnchorColor,
          anchorBorderColor: theme.layerAnchorBorderColor ?? theme.layerHighlightColor ?? theme.highlightColor,
          anchorBorderWidth: theme.layerBorderWidth,
          anchorWidth: theme.layerAnchorWidth,
          borderColor: theme.layerBorderColor ?? theme.layerHighlightColor ?? theme.highlightColor,
          borderWidth: theme.layerBorderWidth,
        })
      }
    }
  }

  // => stage
  private _stage: AtStage | null = null
  public get stage (): AtStage | null {
    return this._stage
  }
  public set stage (stage: AtStage | null) {
    if (this._stage !== stage) {
      if (this._stage !== null) {
        this.remove(this._stage)
      }
      this._stage = stage
      invariant(this._stage !== null)
      this.append(this._stage)
    }
  }

  // => current
  private _current: AtPage | null = null
  public get current () {
    invariant(this._current !== null)
    return this._current
  }
  public set current (value: AtPage | null) {
    if (this._current === null || this._current !== value) {
      if (this._current !== null) {
        this._stage?.remove(this._current)
      }

      this._current = value
      if (this._current !== null) {
        this.stage?.append(this._current)
      }
    }
  }

  // => width
  public get width () {
    return this.configuration.size.width
  }
  public set width (width: number) {
    if (this.configuration.size.width !== width) {
      this.configuration.size.width = width
    }
  }

  // => height
  public get height () {
    return this.configuration.size.height
  }
  public set height (height: number) {
    if (this.configuration.size.height !== height) {
      this.configuration.size.height = height
    }
  }


  public id: string
  public name: string
  public pages: AtPage[] = []
  
  constructor (
    id: string, 
    name: string = `未命名`, 
    configuration: AtDocumentConfiguration
  ) {
    super(configuration)    

    if (configuration.theme !== null)  {
      const size = configuration.size
      const theme = configuration.theme
      this.stage = AtStage.create({
        size,
        anchorColor: theme.layerAnchorColor,
        anchorBorderColor: theme.layerAnchorBorderColor ?? theme.layerHighlightColor ?? theme.highlightColor,
        anchorBorderWidth: theme.layerBorderWidth,
        anchorWidth: theme.layerAnchorWidth,
        borderColor: theme.layerBorderColor ?? theme.layerHighlightColor ?? theme.highlightColor,
        borderWidth: theme.layerBorderWidth,
      })
    }

    this.id = id
    this.name = name
  }

  dispose () {}

  toJSON () {
    return {
      id: this.id,
      name: this.name,
      configuration: this.configuration.toJSON()
    }
  }
}

export enum AtSchemaType {
  Document = `DOCUMENT`,
  Board = `BOARD`,
  Circle = `CIRCLE`,
  Frame = `FRAME`,
  Group = `GROUP`,
  Page = `PAGE`,
  Rectangle = `RECTANGLE`,
  Text = `TEXT`
}

export enum AtSchemaPaintType {
  Image = `IMAGE`,
  Solid = `SOLID`,
  DropShadow = `DROP_SHADOW`
}

export interface AtSchemaPaintStyle {
  type: AtSchemaPaintType,
  opacity: number
}

export interface AtSchema {
  id: string
  type: AtSchemaType,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  visible: boolean,
  locked: boolean,
  radius: number,
  rotation: number,
  fills: AtSchemaPaintStyle[],
  strokes: AtSchemaPaintStyle[],
  effects: AtSchemaPaintStyle[],
  characters: string,
  fontSize: number,
  lineHeight: number
  children: AtSchema[]
}

export interface AtDocumentSchema extends AtSchema {
  id: string
  type: AtSchemaType,
  name: string,
  version: string,
  configuration: {
    zoom: number,
    size: number[],
    version: string
  },
  children: AtSchema[]
} 


export function createElementBySchema (schema: AtSchema): AtElement | null {
  const elementType = schema.type as unknown as ElementType

  const element = AtDocument.createElement(elementType, schema.id, schema.name)
  
  invariant(element !== null)
  element.width = schema.width
  element.height = schema.height
  element.x = 100
  element.x = 100

  createStrokeBySchema(element, schema)
  // createFillBySchema(element, schema)

  if (schema.children) {
    for (const child of schema.children) {
      const childElement = createElementBySchema(child)
      if (childElement !== null) {
        element?.append(childElement)
      }
    }
  }
  return element
}

export function createDocumentPagesBySchema (schema: AtSchema): AtPage {

}

export function createDocumentBySchemaAndConfiguration (
  schema: AtDocumentSchema,
  configuration: AtDocumentConfiguration
): AtDocument {
  const document = AtDocument.create({
    id: schema.id,
    name: schema.name,
    configuration
  })
  
  if (schema.children) {
    for (const child of schema.children) {
      const page = createDocumentPagesBySchema(child) as AtPage
      page.width = configuration.size.width
      page.height = configuration.size.height
      if (page !== null) {
        document.pages.push(page)
      }
    }
  }

  return document
}