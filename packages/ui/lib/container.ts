import { invariant } from '@at/utils'
import { Object } from './object'
import type { ObjectVisitorHandle } from './object'
import type { PipelineOwner } from './pipeline-owner'

//// => Container
// 容器
export abstract class Container extends Object {
  /**
   * 插入节点
   * @param {Object} child 
   * @param {Object | null} afterChild 
   */
  insertAfter (
    child: Object, 
    afterChild: Object | null = null
  ) {
    invariant(child.nextSibling === null, `The "child.nextSibling" can be null.`)
    invariant(child.previousSibling === null, `The "child.previousSibling" can be null.`)
    this.count += 1
    
    invariant(this.count > 0, `The "children" length must gather than zero.`)
    
    if (afterChild === null) {
      child.nextSibling = this.firstChild
      if (this.firstChild !== null) {
        this.firstChild.previousSibling = child
      }
      this.firstChild = child
      this.lastChild ??= child
    } else {
      invariant(this.firstChild !== null, `The "Container.firstChild" cannot be null.`)
      invariant(this.lastChild !== null, `The "Container.lastChild" cannot be null.`)
      
      if (afterChild?.nextSibling === null) {
        invariant(afterChild === this.lastChild, `The "Container.lastChild" must be equal this argument "afterChild"`)
        child.previousSibling = afterChild
        afterChild.nextSibling = child
        this.lastChild = child
      } else {
        child.nextSibling = afterChild?.nextSibling ?? null
        child.previousSibling = afterChild ?? null

        const previousSibling: Object | null = child.previousSibling as Object
        const nextSibling: Object | null = child.nextSibling as Object

        if (previousSibling) {
          previousSibling.nextSibling = child
        }

        if (nextSibling) {
          nextSibling.previousSibling = child
        }

        invariant(afterChild?.nextSibling === child, `The "Container.afterChild.nextSibling" must be equal the argument "child".`)
      }
    }
  }

  /**
   * 插入节点
   * @param {Object} child 
   * @param {Object | null}  afterChild 
   */
  appendChild (
    child: Object, 
    afterChild?: Object | null
  ) {
    invariant(child !== this, 'The argument "child" cannot be inserted into itself.')
    invariant(afterChild !== this , 'The argument "child" cannot simultaneously be both the parent and the sibling of another Object.')
    invariant(child !== afterChild, 'A Object cannot be inserted after itself.')

    this.insertAfter(child, afterChild)
  }

  /**
   * 插入所有节点
   * @param {Object[]} children 
   */
  appendAllChildren (children: Object[]) {
    for (const child of children) {
      this.append(child)
    }
  }

  /**
   * 删除节点
   * @param {Object} child 
   */
  removeChild (child: Object) {
    invariant(this.count >= 0, 'The "Container.count" must gather then zero.')

    if (child.previousSibling === null) {
      invariant(this.firstChild === child)
      this.firstChild = child.nextSibling as Object
    } else {
      const previousSibling = child.previousSibling
      previousSibling.nextSibling = child.nextSibling
    }
    if (child.nextSibling === null) {
      invariant(this.lastChild === child)
      this.lastChild = child.previousSibling as Object
    } else {
      const nextSibling = child.nextSibling
      nextSibling.previousSibling = child.previousSibling
    }

    child.previousSibling = null
    child.nextSibling = null
    this.count -= 1
  }

  /**
   * 删除所有
   */
  removeAllChildren () {
    let child = this.firstChild
    while (child !== null) {
      const next = child.nextSibling as Object
      child.previousSibling = null
      child.nextSibling = null
      this.dropChild(child)
      child = next
    }
    this.firstChild = null
    this.lastChild = null
    this.count = 0
  }

  redepthChildren () {
    let child = this.firstChild
    while (child !== null) {
      this.redepthChild(child)
      child = child.nextSibling as Object
    }
  }

  /**
   * 
   * @param {LayoutObjectVisitor} visitor 
   */
  visit (visitor: ObjectVisitorHandle) {
    let child = this.firstChild
    while (child !== null) {
      visitor(child)
      child = child.nextSibling as Object
    }
  }

  /**
   * 插入
   * @param {Object} child 
   */
  append (child: Object) {
    this.adoptChild(child)
    this.appendChild(child, this.lastChild)
  }

   /**
   * 移动节点
   * @param {Object} child 
   * @param {Object | null} afterChild 
   * @returns 
   */
   move (child: Object, afterChild?: Object | null) {
    invariant(child !== this as unknown as Object)
    invariant(afterChild !== this as unknown as Object)
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
   * @param {Object} child 
   * @returns {Object | null}
   */
  before (child: Object): Object | null {
    invariant(child != null)
    invariant(child.parent == this)

    return child.previousSibling as Object
  }

  /**
   * 
   * @param {Object} child 
   * @returns {Object | null}
   */
  after (child: Object): Object | null {
    invariant(child !== null)
    invariant(child.parent === this)
    
    return child.nextSibling as Object
  }

  /**
   * 删除节点
   * @param {Object} child 
   */
  remove (child: Object) {
    this.removeChild(child)
    this.dropChild(child)
  }

  /**
   * 挂载到渲染管线
   * @param {PipelineOwner} owner 
   */
  attach (owner: PipelineOwner) {
    super.attach(owner)
    let child = this.firstChild

    while (child !== null) {
      child.attach(owner)
      child = child.nextSibling as Object
    }
  }

  /**
   * 卸载
   */
  detach () {
    super.detach()
    let child = this.firstChild ?? null
    
    while (child !== null) {
      child.detach()
      child = child.nextSibling as Object
    }
  }
}