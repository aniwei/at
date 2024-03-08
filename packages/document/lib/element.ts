/// => 基础数据类型

import { invariant } from '@at/utils'
import { BinaryElement } from './flat'

// 混淆模式
export enum BlendMode {
  Normal
}

/// => Color
// 颜色
export interface Color {
  r: number,
  g: number,
  b: number,
  a: number
}

/// => Phase
// 元素阶段
export enum ElementPhaseKind {
  Created
}

/// => ElementKind
// 元素类型
export enum ElementKind {
  // 文档
  Document = 1,
  // 画板
  Canvas,
  // 椭圆
  Ellipse,
  // 
  Symbol,
  // 段落
  Text,
  // 矢量
  Vector,
}

/// => ElementStateKind
// 元素状态
export enum ElementStateKind {
  Visible = 1,
  Locked = 2
}

export interface Element {
  id: number,
  index: number,
  phase: ElementPhaseKind,
  kind: ElementKind,
  state: ElementStateKind,
  name: string,
  opacity: number,
  backgroundColor: Color,
  blendMode: BlendMode,

  // 大小位置
  x: number,
  y: number,
  width: number,
  height: number,

  // 父节点
  parent?: Element | null,
  // 子节点
  children?: Element[],
  // 绘制
  paints: Paint[],
}

/// => Paint
export enum PaintStateKind {
  Visible = 1
}

export interface Paint {
  index: number,
  kind: PaintKind,
  opacity: number,
  blendMode: BlendMode,
  state: PaintStateKind,
  value: string | Color | Blur | Shadow | Gradient
}

/// => PaintKind
// 绘制类别
export enum PaintKind {
  // fill
  Color,
  Image,
  Gradient,
  Video,
  
  // stroke
  Stroke,
  
  // effect
  Shadow,
  Blur
}

export enum StrokePosition {
  Inside,
  Center,
  Outside
}

export enum StrokeStyle {
  Solid,
  Dash,
  Custom
}


/// => Grident
// 渐变
export enum GradientKind {
  Linear,
  Radial,
  Angular,
  Diamond,
}

export interface GradientStop {
  position: number,
  color: Color
}

export interface Gradient {
  kind: GradientKind,
  stops: GradientStop[],
  transform: number[]
}

/// => Shadow
// 阴影
export enum ShadowPosition {
  Inner,
  Drop
}

export enum ShadowKind {
  Inner,
  Drop
}

export interface Shadow {
  kind: ShadowKind,
  x: number,
  y: number,
  blur: number,
  spread: number,
  color: Color
}

/// => Blur
// 模糊
export enum BlurPosition {
  Foreground,
  Background
}

export enum BlurKind {
  Layer,
  Background
}

export interface Blur {
  kind: BlurKind,
  blur: number
}

/**
 * 根据 id 获取元素
 * @param {Element[]} elements 
 * @param {number} id 
 * @returns {Element | null}
 */
export const findElementById = (
  elements: Element[], 
  id: number
): Element | null => {
  return elements.find(element => {
    return id === element.id
  }) ?? null
}

/**
 * 组装 element tree
 * @param {BinaryElement[]} elements 
 */
export const documentAssemble = (rootId: number, binaryElements: BinaryElement[]): Element => { 
  const elements = binaryElements.map(createElement)
  const root = findElementById(elements, rootId)

  invariant(root !== null, 'The "root" element cannot be null.')

  let binaryElement: BinaryElement | null = binaryElements.shift() ?? null

  while (binaryElement !== null) {
    if (binaryElement.id !== rootId) {
      const element = findElementById(elements, binaryElement.id) as Element
      const parent = binaryElement.parentId === root.id 
        ? root
        : findElementById(elements, binaryElement.parentId) as Element
  
      parent.children ??= []
      parent.children.push(element)  
    }

    binaryElement = binaryElements.shift() ?? null
  }
  
  return root
}


/**
 * 创建 element
 * @param {BinaryElement} element 
 * @returns {Element}
 */
export const createElement = (binaryElement: BinaryElement): Element => {
  const element = {
    id: binaryElement.id,
    index: binaryElement.index,
    phase: binaryElement.phase,
    kind: binaryElement.kind,
    state: binaryElement.state,
    name: binaryElement.name,
    opacity: binaryElement.opacity,
    backgroundColor: binaryElement.backgroundColor,
    blendMode: binaryElement.blendMode,
    x: binaryElement.x,
    y: binaryElement.y,
    width: binaryElement.width,
    height: binaryElement.height,
    paints: binaryElement.paints
  }

  return element
}