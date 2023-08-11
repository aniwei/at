import { AtBorder, AtDecorationImage, AtNetworkImage, BorderStyle, Color, ImageRepeat, Radius, Size } from '@at/framework'
import { AtDocument } from './element/document'
import { AtElementDecoratedPainter } from './element/element-painter'
import { AtPage } from './element/page'
import { AtRectangle } from './element/rectangle'

export function createExample (document: AtDocument) {
  
  
  const page = AtPage.create(Size.create(document.width, document.height))
  
  const rect = AtRectangle.create({
    width: 100,
    height: 100,
    radius: Radius.circular(10)
  })

  page.append(rect)

  document.current = page
}