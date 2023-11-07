import invariant from '@at/utility'
import { 
  At, 
  AtLayoutBox, 
  AtLayoutParagraph, 
  AtStrutStyle, 
  AtTextHeightBehavior, 
  AtViewportOffset, 
  TextAlign, 
  TextDirection, 
  TextOverflow, 
  TextWidthBasis, 
  AtParagraphCaretPainter, 
  AtParagraphHighlightPainter, 
  AtImage,
  Rect,
  Radius,
} from '@at/framework'
import { AtFrame, AtFramePainter } from './frame'

export type AtBoardOptions = {
  id: string,
  name: string,
  width?: number,
  height?: number,
  radius?: Radius
}

export class AtBoard extends AtFrame {
  
  static create (options: AtBoardOptions) {
    const board = new AtBoard(
      options.id,
      options.name,
      AtBoardPainter.create(
        options.width,
        options.height,
        options.radius
      )
    )

    return board
  }

  get frame (): Rect {
    return Rect.fromLTWH(
      this.offset.dx as number,
      this.offset.dy as number,
      this.width as number,
      this.height as number 
    )
  }

  public image: AtImage | null = null

  constructor (
    id: string,
    name: string,
    painter: AtBoardPainter
  ) {
    super(id, name, painter)
    this.isRepaintBoundary = true
  }
}


export class AtBoardPainter extends AtFramePainter {
  static create (
    width: number = 100.0,
    height: number = 100.0,
    radius: Radius = Radius.zero
  ) {
    return new AtBoardPainter(
      width,
      height, 
      radius
    )
  }
}

export class AtBoardLabelPaint extends AtLayoutParagraph {
  static create (text: unknown) {
    return new AtBoardLabelPaint(text as string)
  }

  constructor (
    text: string,
    devicePixelRatio: number = 2.0,
    viewport: AtViewportOffset = AtViewportOffset.zero,
    paintCaretAboveText: boolean = true,
    editable: boolean = false,
    selectable: boolean = false,
    textAlign: TextAlign = At.TextAlign.Start,
    textDirection: TextDirection = At.TextDirection.LTR,
    softWrap: boolean = true,
    overflow: TextOverflow = TextOverflow.Clip,
    textScaleFactor: number = 1.0,
    maxLines: number | null = null,
    minLines: number | null = null,
    strutStyle: AtStrutStyle | null = null,
    textWidthBasis: TextWidthBasis = TextWidthBasis.Parent,
    textHeightBehavior: AtTextHeightBehavior = AtTextHeightBehavior.create(),
    caret: AtParagraphCaretPainter | null = null,
    highlighter: AtParagraphHighlightPainter | null = null,
    children: AtLayoutBox[] = [],
  ) {
    super(
      At.AtLayoutParagraphDelegate.create({
        text: At.AtTextSpan.create({
          text: text,
          style:  At.AtTextPaintingStyle.create({
            fontFamily: 'PingFang',
            fontSize: 10,
            color: At.Color.fromRGBO(161, 161, 161, 1)
          }),
        }),
      }),
      devicePixelRatio,
      viewport,
      paintCaretAboveText,
      editable,
      selectable,
      textAlign,
      textDirection,
      softWrap,
      overflow,
      textScaleFactor,
      maxLines,
      minLines,
      strutStyle,
      textWidthBasis,
      textHeightBehavior,
      caret,
      highlighter,
      children,
    )
  }
}
