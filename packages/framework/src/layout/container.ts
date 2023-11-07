import invariant from '@at/utility'
import { AtLayoutObject } from './object'
import type { LayoutObjectVisitor } from './object'
import type { AtPipelineOwner } from './pipeline-owner'

export abstract class AtLayoutContainer extends AtLayoutObject {
  /**
   * 
   * @param {AtLayoutObject} child 
   * @param {AtLayoutObject | null} afterChild 
   */
  insertAfter (
    child: AtLayoutObject, 
    afterChild: AtLayoutObject | null = null
  ) {
    invariant(child.nextSibling === null, `The "child.nextSibling" cannot be null.`)
    invariant(child.previousSibling === null, `The "child.previousSibling" cannot be null.`)
    this.childCount += 1
    
    invariant(this.childCount > 0, `The "children" length must gather than zero.`)
    if (afterChild === null) {
      child.nextSibling = this.firstChild
      if (this.firstChild !== null) {
        this.firstChild.previousSibling = child
      }
      this.firstChild = child
      this.lastChild ??= child
    } else {
      invariant(this.firstChild !== null, `The "this.firstChild" cannot be null.`)
      invariant(this.lastChild !== null, `The "this.lastChild" cannot be null.`)
      
      if (afterChild?.nextSibling === null) {
        invariant(afterChild === this.lastChild, `The "this.lastChild" must be equal this argument "afterChild"`)
        child.previousSibling = afterChild
        afterChild.nextSibling = child
        this.lastChild = child
      } else {
        child.nextSibling = afterChild?.nextSibling ?? null
        child.previousSibling = afterChild ?? null

        const previousSibling: AtLayoutObject | null = child.previousSibling as AtLayoutObject
        const nextSibling: AtLayoutObject | null = child.nextSibling as AtLayoutObject

        if (previousSibling) {
          previousSibling.nextSibling = child
        }

        if (nextSibling) {
          nextSibling.previousSibling = child
        }

        invariant(afterChild?.nextSibling === child, `The "afterChild.nextSibling" must be equal the argument "child".`)
      }
    }
  }

  /**
   * 
   * @param {AtLayoutObject} child 
   * @param {AtLayoutObject | null}  afterChild 
   */
  appendChild (
    child: AtLayoutObject, 
    afterChild?: AtLayoutObject | null
  ) {
    invariant(child !== this as unknown as AtLayoutObject, 'A AtLayoutObject cannot be inserted into itself.')
    invariant(afterChild !== this as unknown as AtLayoutObject, 'A AtLayoutObject cannot simultaneously be both the parent and the sibling of another AtLayoutObject.')
    invariant(child !== afterChild, 'A AtLayoutObject cannot be inserted after itself.')
    invariant(child !== this.firstChild)
    invariant(child !== this.lastChild)
    this.insertAfter(child, afterChild)
  }

  /**
   * 
   * @param {AtLayoutObject} child 
   */
  append (child: AtLayoutObject) {
    this.adoptChild(child)
    this.appendChild(child, this.lastChild)
  }

  /**
   * 
   * @param {AtLayoutObject[]} children 
   */
  appendAllChildren (children: AtLayoutObject[]) {
    for (const child of children) {
      this.append(child)
    }
  }

  /**
   * 
   * @param {AtLayoutObject} child 
   */
  removeChild (child: AtLayoutObject) {
    invariant(this.childCount >= 0)

    if (child.previousSibling === null) {
      invariant(this.firstChild === child)
      this.firstChild = child.nextSibling as AtLayoutObject
    } else {
      const previousSibling = child.previousSibling
      previousSibling.nextSibling = child.nextSibling
    }
    if (child.nextSibling === null) {
      invariant(this.lastChild === child)
      this.lastChild = child.previousSibling as AtLayoutObject
    } else {
      const nextSibling = child.nextSibling
      nextSibling.previousSibling = child.previousSibling
    }

    child.previousSibling = null
    child.nextSibling = null
    this.childCount -= 1
  }

  /**
   * 
   * @param {AtLayoutObject} child 
   */
  remove (child: AtLayoutObject) {
    this.removeChild(child)
    this.dropChild(child)
  }

  removeAllChildren () {
    let child = this.firstChild
    while (child !== null) {
      const next = child.nextSibling as AtLayoutObject
      child.previousSibling = null
      child.nextSibling = null
      this.dropChild(child)
      child = next
    }
    this.firstChild = null
    this.lastChild = null
    this.childCount = 0
  }

  /**
   * 
   * @param {AtLayoutObject} child 
   * @param {AtLayoutObject | null} afterChild 
   * @returns 
   */
  move (child: AtLayoutObject, afterChild?: AtLayoutObject | null) {
    invariant(child !== this as unknown as AtLayoutObject)
    invariant(afterChild !== this as unknown as AtLayoutObject)
    invariant(child !== afterChild)
    invariant(child.parent === this)

    if (child.previousSibling === afterChild) {
      return
    }

    this.removeChild(child)
    this.insertAfter(child, afterChild)
    this.markNeedsLayout()
  }

  /**
   * 
   * @param {AtPipelineOwner} owner 
   */
  attach (owner: AtPipelineOwner) {
    super.attach(owner)
    let child = this.firstChild

    while (child !== null) {
      child.attach(owner)
      child = child.nextSibling as AtLayoutObject
    }
  }

  detach () {
    super.detach()
    let child = this.firstChild
    
    while (child !== null) {
      child.detach()
      child = child.nextSibling as AtLayoutObject
    }
  }

  redepthChildren () {
    let child = this.firstChild
    while (child !== null) {
      this.redepthChild(child)
      child = child.nextSibling as AtLayoutObject
    }
  }

  /**
   * 
   * @param {LayoutObjectVisitor} visitor 
   */
  visit (visitor: LayoutObjectVisitor) {
    let child = this.firstChild
    while (child !== null) {
      visitor(child)
      child = child.nextSibling as AtLayoutObject
    }
  }

  /**
   * 
   * @param {AtLayoutObject} child 
   * @returns {AtLayoutObject | null}
   */
  childBefore (child: AtLayoutObject): AtLayoutObject | null {
    invariant(child != null)
    invariant(child.parent == this)

    return child.previousSibling as AtLayoutObject
  }

  /**
   * 
   * @param {AtLayoutObject} child 
   * @returns {AtLayoutObject | null}
   */
  childAfter (child: AtLayoutObject): AtLayoutObject | null {
    invariant(child !== null)
    invariant(child.parent === this)
    
    return child.nextSibling as AtLayoutObject
  }
}