import type { 
  Element, 
} from './element'

//// => flat
export interface BinaryElement extends Element {
  parentId: number
}

/**
 * 扁平节点
 * @param {element} element 
 * @param {Element | null} parent 
 * @param {BinaryElement[]} results 
 * @param {number} index 
 * @returns {BinaryElement[]}
 */
export const createBinaryElements = (
  element: Element, 
  parent: Element | null = null,
  results: BinaryElement[] = [],
  index: number = 0
): BinaryElement[] => {

  const binaryElement: BinaryElement = {
    id: element.id,
    index,
    phase: element.phase,
    parentId: 0,
    kind: element.kind,
    name: element.name,
    state: element.state,
    opacity: element.opacity,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    blendMode: element.blendMode,
    backgroundColor: element.backgroundColor,
    paints: element.paints,
  }

  if (parent !== null) {
    binaryElement.parentId = parent.id
  }

  results.push(binaryElement)

  if (element.children && element.children.length > 0) {
    for (let i = 0; i < element.children.length; i++) {
      createBinaryElements(element.children[i], element, results, index + i)
    }
  }

  return results
}

