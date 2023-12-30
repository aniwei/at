import { invariant } from '@at/utils'
import { Offset } from '@at/geometry'
import { Equalable } from '@at/basic'

import { Engine } from './engine'
import { TextPosition } from './text-position'
import { TextRange } from './text-range'
import { TextBox } from './text-box'
import { ParagraphBuilder } from './paragraph-builder'
import { ParagraphCommand, ParagraphCommandKind } from './paragraph-command'
import { fromPositionWithAffinity } from './to'

import * as Skia from './skia'
import { ParagraphStyle } from './paragraph-style'


//// => ParagraphConstraints
// 段落文本约束
export class ParagraphConstraints extends Equalable<ParagraphConstraints> {
  static create (width: number) {
    return new ParagraphConstraints(width)
  }

  // 约束宽度
  public width: number

  /**
   * @param {number} width
   * @return {ParagraphConstraints}
   */
  constructor (width: number) {
    super()
    this.width = width
  }
  
  /**
   * 是否相等
   * @param {ParagraphConstraints} other
   * @return {boolean}
   */
  equal (other: ParagraphConstraints) {
    return (
      other instanceof ParagraphConstraints && 
      other.width === this.width
    )
  }

  /**
   * 是否相等
   * @param {ParagraphConstraints} other 
   * @returns {boolean}
   */
  notEqual (other: ParagraphConstraints) {
    return !this.equal(other)
  }
  
  /**
   * @return {*}
   */
  toString () {
    return `ParagraphConstraints(
      [width]: ${this.width}
    )`
  }
}

//// => Paragraph
export interface ParagraphOptions {
  paragraph: Skia.Paragraph,
  style: ParagraphStyle,
  commands: ParagraphCommand[],
}

export class Paragraph extends Skia.ManagedSkiaRef<Skia.Paragraph> {
  static create (options: ParagraphOptions) {
    return new Paragraph(
      options.paragraph,
      options.style,
      options.commands
    )
  }

  /**
   * @param {ParagraphConstraints} constraints
   * @return {Skia.Paragraph}
   */
  static resurrect (
    style: ParagraphStyle,
    commands: ParagraphCommand[],
  ): Skia.Paragraph {
    
    const builder = ParagraphBuilder.create(style)
      
    for (const command of commands) {
      switch (command.type) {
        case ParagraphCommandKind.Text:
          invariant(command.text)
          builder.text(command.text)
          break

        case ParagraphCommandKind.Pop:
          builder.pop()
          break

        case ParagraphCommandKind.Style:
          invariant(command.style)
          builder.push(command.style)
          break

        case ParagraphCommandKind.Placeholder: 
          invariant(command.placeholder)
          const style = command.placeholder

          builder.commands.push(ParagraphCommand.placeholder(style))
          builder.placeholder(
            style.width,
            style.height,
            style.alignment,
            1.0,
            style.offset,
            style.baseline,
          )
          break
      }

    }

    const paragraph = builder.buildParagraph()
    return paragraph
  }

  // => skia
  public get skia () {
    return super.skia
  }

  // => paragraph
  public get paragraph () {
    return this.skia
  }

  public height: number = 0
  public width: number = 0
  public longestLine: number = 0
  public alphabeticBaseline: number = 0
  public ideographicBaseline: number = 0
  public maxIntrinsicWidth: number = 0
  public minIntrinsicWidth: number = 0
  public didExceedMaxLines: boolean = false
  public boxesForPlaceholders: TextBox[] | null = null
  public constraints: ParagraphConstraints | null = null

  public style: ParagraphStyle | null = null
  public commands: ParagraphCommand[] = []

  constructor (
    paragraph: Skia.Paragraph,
    style: ParagraphStyle,
    commands: ParagraphCommand[],
  ) {
    super(paragraph)
    this.style = style
    this.commands = commands
  }

  /**
   * @param {ParagraphConstraints} constraints
   * @return {Skia.Paragraph}
   */
  ensure (constraints: ParagraphConstraints): Skia.Paragraph {
    let paragraph = this.paragraph ?? null
    let didRebuild = false

    if (paragraph === null) {
      invariant(this.style)
      paragraph = Paragraph.resurrect(this.style, this.commands)
      didRebuild = true
    }

    if (
      didRebuild || 
      this.constraints === null || 
      this.constraints.notEqual(constraints)
    ) {
      this.constraints = constraints

      try {
        paragraph.layout(constraints.width)

        this.height = paragraph.getHeight()
        this.width = paragraph.getMaxWidth()

        this.alphabeticBaseline = paragraph.getAlphabeticBaseline()
        this.didExceedMaxLines = paragraph.didExceedMaxLines()
        this.ideographicBaseline = paragraph.getIdeographicBaseline()
        this.longestLine = paragraph.getLongestLine()
        
        this.maxIntrinsicWidth = paragraph.getMaxIntrinsicWidth()
        this.minIntrinsicWidth = paragraph.getMinIntrinsicWidth()
      } catch (error: any) {
        throw new Error(`At threw an exception while laying out the paragraph. The font was "${this.style?.fontFamily}". `)
      }
    }

    return paragraph
  }

  markUsed () {
    // TODO
    // if (!this.paragraphCache.markUsed(this)) {
    //   this.paragraphCache.add(this);
    // }
  }

  /**
   * @return {*}
   */
  getBoxesForPlaceholders () {
    invariant(this.constraints)
    const paragraph = this.ensure(this.constraints)
    const rects: Skia.RectWithDirection[] = paragraph.getRectsForPlaceholders()

    invariant(this.style?.textDirection)

    const boxes: TextBox[] = []
    for (const r of rects) {
      boxes.push(TextBox.fromLTRBD(
        r.rect[0],
        r.rect[1],
        r.rect[2],
        r.rect[3],
        this.style?.textDirection
      ))
    }

    return boxes
  }
  
  /**
   * @return {*}
   */
  getBoxesForRange (
    start: number,
    end: number, 
    boxHeightStyle: Skia.RectHeightStyle = Engine.skia.RectHeightStyle.Tight,
    boxWidthStyle: Skia.RectHeightStyle = Engine.skia.RectWidthStyle.Tight,
  ): TextBox[] {
    if (start < 0 || end < 0) {
      return []
    }
    invariant(this.constraints)
    const paragraph = this.ensure(this.constraints)
    const rects: Skia.RectWithDirection[] = paragraph.getRectsForRange(
      start,
      end,
      boxHeightStyle,
      boxWidthStyle,
    ) as unknown as Skia.RectWithDirection[]

    invariant(this.style?.textDirection)

    const boxes: TextBox[] = []
    for (const r of rects) {
      boxes.push(TextBox.fromLTRBD(
        r.rect[0],
        r.rect[1],
        r.rect[2],
        r.rect[3],
        this.style?.textDirection
      ))
    }

    return boxes
  }


  /**
   * @param {Offset} offset
   * @return {*}
   */  
  getPositionForOffset (offset: Offset): TextPosition {
    const paragraph = this.ensure(this.constraints!)
    const positionWithAffinity =
      paragraph.getGlyphPositionAtCoordinate(
      offset.dx,
      offset.dy,
    )
    
    return fromPositionWithAffinity(positionWithAffinity)
  }
  /**
   * @param {TextPosition} position
   * @return {*}
   */  
  getWordBoundary (position: TextPosition ): TextRange {
    const paragraph = this.ensure(this.constraints!)
    const range = paragraph.getWordBoundary(position.offset)
    return new TextRange(range.start, range.end)
  }

  /**
   * 获取行边界
   * @param {TextPosition} position
   * @return {*}
   */  
  getLineBoundary (position: TextPosition): TextRange {
    const paragraph = this.ensure(this.constraints!)
    const metrics: Skia.LineMetrics[] = paragraph.getLineMetrics()
    const offset: number = position.offset

    for (const metric of metrics) {
      if (offset >= metric.startIndex && offset <= metric.endIndex) {
        return TextRange.create(
          metric.startIndex, 
          metric.endIndex
        )
      }
    }

    return TextRange.create(-1, -1)
  }

  
  computeLineMetrics (): Skia.LineMetrics[] {
    invariant(this.constraints)
    const paragraph = this.ensure(this.constraints)
    const skias = paragraph.getLineMetrics()
    const result: Skia.LineMetrics[] = []

    for (const metric of skias) {
      result.push(metric)
    }

    return result
  }

  /**
   * 文本布局
   * @param {ParagraphConstraints} constraints
   * @return {void}
   */  
  layout (constraints: ParagraphConstraints) {
    if (this.constraints === null || this.constraints.notEqual(constraints)) {
      this.ensure(constraints)
      this.markUsed()
    }
  }

  dispose () {
    this.paragraph?.delete()
  }
}
