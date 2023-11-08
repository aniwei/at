import invariant from '@at/utils'
import { AtDocument, AtDocumentConfiguration, ElementType } from './document'
import { AtElement } from './element'
import { AtPage } from './page'
import { AtElementDecoratedPainter } from './element-painter'
import { AtBorder, AtDecorationImage, AtNetworkImage, BorderStyle, Color } from '@at/framework'

export enum AtSchemaType {
  Document = `DOCUMENT`,
  Board = `BOARD`,
  Frame = `FRAME`,
  Group = `GROUP`,
  Rectangle = `RECTANGLE`,
  Circle = `CIRCLE`,
  Text = `TEXT`
}

export enum AtFillType {
  Image = `IMAGE`,
  Solid = `SOLID`
}

export enum AtStrokeType {
  Solid = `SOLID`
}

export enum AtEffectType {
  DropShadow = `DROP_SHADOW`
}

export enum AtBlendMode {
  Normal = `NORMAL`
}


export type AtFillStyle = {
  type: AtFillType,
  visible: boolean,
  opacity: number,
  blendMode: AtBlendMode,
  color: number[]
}

export type AtStrokeStyle = {
  type: AtStrokeType,
  visible: boolean,
  blendMode: string,
  color: number[]
}

export type AtEffectStyle = {
  type: AtEffectType
}

export type AtViewport = {
  zoom: number,
  origin: {
    x: number,
    y: number
  },
  frame: {
    x: number,
    y: number,
    width: number,
    height: number
  }
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
  fills: AtFillStyle[],
  strokes: AtStrokeStyle[],
  effects: AtEffectStyle[],
  characters: string,
  fontSize: number,
  lineHeight: number
  children?: AtSchema[]
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

export interface AtTextSchema extends AtSchema {
  characters: string,
  fontSize: number,
  lineHeight: number
}

export interface AtBoardSchema extends AtSchema {
  children: AtSchema[]
}

export interface AtGroupSchema extends AtSchema {
  children: AtSchema[]
}

export function createStrokeBySchema (element, schema: AtSchema) {
  const strokes = schema.strokes
  if (strokes) {
    for (const stroke of strokes) {
      const painter = AtElementDecoratedPainter.create()

      switch (stroke.type) {
        case AtStrokeType.Solid: {
          painter.border = AtBorder.create({
            color: Color.fromRGBO(
              stroke.color.r * 255, 
              stroke.color.g * 255, 
              stroke.color.b * 255, 
              stroke.opacity
            ),
            width: 1,
            style: BorderStyle.Solid
          })

          break
        }
      }

      element.strokes.use(painter)
    }
  }
}

export function createFillBySchema (element, schema: AtSchema) {
  const fills = schema.fills
  if (fills && fills.length > 0) {
    for (const fill of fills) {
      const painter = AtElementDecoratedPainter.create()

      switch (fill.type) {
        case AtFillType.Solid: {
          painter.color = Color.fromRGBO(
            fill.color.r * 255, 
            fill.color.g * 255, 
            fill.color.b * 255, 
            fill.opacity
          )

          break
        }

        case AtFillType.Image: {
          painter.image = AtDecorationImage.create({
            image: AtNetworkImage.create({
              url: `/assets/wukong.png`
            })
          })

          break
        }
      }

      element.fills.use(painter)
    }
  }
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
      const element = createElementBySchema(child) as AtPage
      element.width = configuration.size.width
      element.height = configuration.size.height
      if (element !== null) {
        document.pages.push(element)
      }
    }
  }

  return document
}


