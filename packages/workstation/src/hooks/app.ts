import { App } from '@lib/app'
import * as E from '@at/engine'

const app = App.create()
app.start(() => {

  // fetch('/assets/medal.png')
  //   .then(res => res.arrayBuffer())
  //   .then(data => {

  //     const proxy = ParagraphProxy.create({
  //       text: TextSpan.create({
  //         text: '莫听穿林打叶声，何妨吟啸且徐行。竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。料峭春风吹酒醒，微冷，山头斜照却相迎。',
  //         style: TextPaintingStyle.create({
  //           fontFamily: 'SourceHanSansSC-VF',
  //           fontSize: 30
  //         })
  //       }),
  //       selection: TextSelection.create(0, 5)
  //     })

  //     const paragraph = Paragraph.create({
  //       proxy,
  //     })

  //     const paragraphEditable = ParagraphEditable.create({
  //       paragraph,
  //       caret: ParagraphCaretPainter.create(),
  //       highlighter: ParagraphHighlightPainter.create({
  //         color: Color.fromRGBO(255, 0, 0, 0.5)
  //       })
  //     })

  //     const mouseRegion = MouseRegionBox.create({
  //       child: paragraphEditable,
  //       cursor: text,
  //       onEnter () {
  //         console.log('onEnter')
  //       },
  //       onExit () {
  //         console.log('onExit')
  //       },
  //       onHover () {
  //         console.log('onHover')
  //       }
  //     })
     
  //     const image = Image.create({
  //       image: E.Image.create(App.skia.MakeImageFromEncoded(data))
  //     })  

  //     const rotated = RotatedBox.create({
  //       child: image,
  //       quarterTurns: 4
  //     })


  //     const flex = Row.create({
  //       direction: Engine.skia.Axis.Horizontal,
  //       mainAxisAlignment: MainAxisAlignment.Center,
  //       children: [
  //         Expanded.create({
  //           flex: 1,
  //           child: rotated
  //         }),
  //         Expanded.create({
  //           child: mouseRegion
  //         })
  //       ]
  //     })

  //     const transform = TransformBox.create({
  //       child: flex
  //     })

  //     transform.translate(100, 100)
  //     transform.rotateY(0)
      
  //     app.view.append(transform)
  //     app.flush()
  //   })
})