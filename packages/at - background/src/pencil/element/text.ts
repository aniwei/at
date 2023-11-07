import invariant from '@at/utility'
import { At, AtTextSpan, AtLayoutParagraph, Rect } from '@at/framework'
import { AtShape, AtShapePainter } from './shape'

export type AtTextOptions = {
  id: string,
  name: string,
  characters?: AtTextSpan[]
}

export class AtText extends AtShape {
  static create (options: AtTextOptions) {
    return new AtText(
      options.id,
      options.name,
      AtTextPainter.create(),
      options.characters,
    )
  }

  public get frame () {
    invariant(this.width !== null && this.height !== null)
    return Rect.fromLTWH(0, 0, this.width, this.height)
  }

  // => characters
  private _characters: AtTextSpan[] | null = null
  public get characters () {
    return this._characters
  }
  public set characters (value: AtTextSpan[] | null) {
    if (this._characters === null || this._characters !== value) {
      this._characters = value
  
      this.paragraph = At.AtLayoutParagraph.create({
        delegate: At.AtLayoutParagraphDelegate.create({
          text: At.AtTextSpan.create({
            children: this._characters
          })
        }),
        viewport: At.AtViewportOffset.zero,
        selectable: true,
        highlighter: At.AtParagraphHighlightPainter.create(At.Color.fromRGBO(0, 0, 0, 0.5)),
        textHeightBehavior: At.AtTextHeightBehavior.create(),
        textDirection: At.TextDirection.LTR
      })
    }
  }

  // => paragraph
  private _paragraph: AtLayoutParagraph | null = null
  public get paragraph () {
    return this._paragraph
  }
  public set paragraph (value: AtLayoutParagraph | null) {
    if (this._paragraph === null || this._paragraph !== value)  {
      this._paragraph?.dispose()

      if (this._paragraph !== null) {
        this.remove(this._paragraph)
      }

      this._paragraph = value
      invariant(this._paragraph!== null)
      this.append(this._paragraph)
    }
  }

  constructor (
    id: string,
    name: string,
    painter: AtTextPainter,
    characters: AtTextSpan[] | null = null,
  ) {
    super(id, name, painter)

    if (characters !== null) {
      this.characters = characters
    }

    this.isRepaintBoundary = true
  }
}

export class AtTextPainter extends AtShapePainter {
  static create () {
    return new AtTextPainter()
  }

  constructor () {
    super()
  }
}