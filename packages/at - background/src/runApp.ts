import invariant from '@at/utility'
import { App, AtTextPaintingStyle, AtTextSpan } from '@at/framework'
import { AtFixedViewportOffset } from '@at/framework/dist/layout/viewport-offset'
import { At, AtLayoutBox, Image } from '@at/framework'

export async function runApp (app: App) {
  const i = await app.assets.load('wukong.png').then(res => res.arrayBuffer())

  const skImage = At.MakeImageFromEncoded(i) as Image

  // const controller = At.AtEditableController.create({
  //   text: 'AttttttttttttttttttAttttttttttttttttttAttttttttttttttttttAttttttttttttttttttAtttttttttttttttttt',
  //   selection: At.AtTextSelection.create({
  //     baseOffset: 1,
  //     extentOffset: 1
  //   })
  // })

  // const input = At.AtInputLayout.create({
  //   cursorColor: At.Color.fromRGBO(255, 0, 0, 1),
  //   style: At.AtTextPaintingStyle.create({
  //     fontFamily: 'Roboto',
  //     fontSize: 32
  //   }),
  //   backgroundCursorColor: At.Color.fromRGBO(0, 0, 0, 1),
  //   showCursor: true,
  //   forceLine: true,
  //   cursorWidth: 2.0,
  //   textDirection: At.TextDirection.LTR,
  //   textHeightBehavior: At.AtTextHeightBehavior.create(),
  //   viewport: AtFixedViewportOffset.zero,
  //   paintCursorAboveText: true,
  //   selectionColor: At.Color.fromRGBO(0, 255, 0, 1),
  //   controller,
  // })

  // const editable = At.AtLayoutEditable.create({
  //   delegate: controller,
  //   style: At.AtTextPaintingStyle.create({
  //     fontFamily: 'Roboto',
  //     fontSize: 32
  //   }),
  //   cursorColor: At.Color.fromRGBO(255, 0, 0, 1),
  //   backgroundCursorColor: At.Color.fromRGBO(0, 0, 0, 1),
  //   showCursor: true,
  //   forceLine: true,
  //   cursorWidth: 2.0,
  //   selectionColor: At.Color.fromRGBO(255, 0, 0, 0.5),
  //   textDirection: At.TextDirection.LTR,
  //   textHeightBehavior: At.AtTextHeightBehavior.create(),
  //   startHandleLayerLink: new At.AtLayerLink,
  //   endHandleLayerLink: new At.AtLayerLink,
  //   viewport: AtFixedViewportOffset.zero,
  //   paintCursorAboveText: true,
  //   onSelectionChanged: function (selection: AtTextSelection, cause: SelectionChangedCause): void {
      
  //   },
  //   onCaretChanged: function (caretRect: Rect): void {
      
  //   }
  // })

  const delegate = At.AtLayoutParagraphDelegate.create({
    text: AtTextSpan.create({
      children: [
        AtTextSpan.create({
          text: '我们在进行开发的时候经常会遇到一段文本中会有不同的字体，不同的颜色展示，在Android开发中我们会使用SpannableString或者Html.fronHtml来进行处理，那么在Flutter中如何处理来做这样的展示呢，Flutter为我们提供了一个可以展示多中样式的Widget',
          style: AtTextPaintingStyle.create({
            fontFamily: 'PingFang',
            fontSize: 14,
            color: At.Color.fromRGBO(12, 12, 21, 1)
          })
        }),
        AtTextSpan.create({
          text: 'word',
          style: AtTextPaintingStyle.create({
            fontFamily: 'PingFang',
            fontSize: 32
          })
        })
      ]
    }),
    selection: At.AtTextSelection.create({
      extentOffset: 1,
      baseOffset: 1
    })
  })

  const caret = At.AtParagraphCaretPainter.create({
    width: 2.0
  })

  caret.color = At.Color.fromRGBO(221, 12, 241, .5)

  const highlighter = At.AtParagraphHighlightPainter.create(
    At.Color.fromRGBO(111, 191, 244, .7)
  )

  const paragraph = At.AtLayoutParagraph.create({
    delegate,
    caret,
    highlighter,
    selectable: true,
    editable: false,
    viewport: AtFixedViewportOffset.zero,
    textDirection: At.TextDirection.LTR,
    textHeightBehavior: At.AtTextHeightBehavior.create()
  })

  const children: AtLayoutBox[] = []
  for (let i = 0; i < 1; i++) {
    const image = At.AtLayoutImage.create({
      image: new At.AtImage(skImage),
      width: 116,
      height: 100
    })

    image.left = i * 5
    image.top = i * 5

    children.push(image)
  }



  const stack = At.AtLayoutStack.create([...children, paragraph], {
    alignment: At.AtAlignment.center
  })

  invariant(app.view)
  app.view.child = stack

  caret.start()
  app.start()

  // editable.startCursorBlink()
}