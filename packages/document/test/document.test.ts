import { expect, test } from 'vitest'
import { documentRead } from '../lib/read'
import { documentWrite } from '../lib/write'
import { BlendMode, BlurKind, Element, ElementKind, ElementPhaseKind, ElementStateKind, GradientKind, PaintKind, PaintStateKind, ShadowKind } from '../lib/element'

test('Document encoding and decoding', () => {
  const element: Element = {
    kind: ElementKind.Canvas,
    id: 11,
    index: 0,
    phase: ElementPhaseKind.Created,
    state: ElementStateKind.Visible,
    name: 'Test1',
    opacity: 10,
    backgroundColor: {
      r: 10,
      g: 20,
      b: 30,
      a: 100
    },
    blendMode: BlendMode.Normal,
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    children: [{
      kind: ElementKind.Text,
      index: 2,
      id: 12,
      phase: ElementPhaseKind.Created,
      state: ElementStateKind.Visible,
      name: 'Test2',
      opacity: 10,
      backgroundColor: {
        r: 10,
        g: 20,
        b: 30,
        a: 100
      },
      blendMode: BlendMode.Normal,
      x: 10,
      y: 10,
      width: 10,
      height: 10,
      children: [],
      paints: [{
        index: 0,
        kind: PaintKind.Blur,
        opacity: 10,
        blendMode: BlendMode.Normal,
        state: PaintStateKind.Visible,
        value: {
          blur: 10,
          kind: BlurKind.Layer
        }
      }, {
        index: 0,
        kind: PaintKind.Shadow,
        opacity: 10,
        blendMode: BlendMode.Normal,
        state: PaintStateKind.Visible,
        value: {
          blur: 10,
          kind: ShadowKind.Drop,
          x: 11,
          y: 12,
          spread: 0,
          color: {
            r: 1,
            g: 2,
            b: 3,
            a: 4
          }
        }
      }]
    }],
    paints: [{
      index: 0,
      kind: PaintKind.Color,
      opacity: 10,
      blendMode: BlendMode.Normal,
      state: PaintStateKind.Visible,
      value: {
        r: 10,
        g: 11,
        b: 12,
        a: 13
      }
    }, {
      index: 0,
      kind: PaintKind.Image,
      opacity: 10,
      blendMode: BlendMode.Normal,
      state: PaintStateKind.Visible,
      value: 'https://www.baidu.com'
    }, {
      index: 0,
      kind: PaintKind.Gradient,
      opacity: 10,
      blendMode: BlendMode.Normal,
      state: PaintStateKind.Visible,
      value: {
        kind: GradientKind.Linear,
        transform: [1, 2, 3, 4, 5, 6],
        stops: [{
          color: {
            r: 1,
            g: 1,
            b: 1,
            a: 2
          },
          position: 10
        }, {
          color: {
            r: 3,
            g: 3,
            b: 3,
            a: 2
          },
          position: 20
        }]
      }
    }]
  }

  const bytes = documentWrite(element, {
    x: 10,
    y: 10,
    z: 11
  })

  const result = documentRead(bytes)
  expect(result.root).toEqual(element)
})