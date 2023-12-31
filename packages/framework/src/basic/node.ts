/*
 * @author: aniwei aniwei.studio@gmail.com
 * @date: 2022-10-31 00:53:37
 */
import { invariant } from '@at/utils'

export abstract class AbstractNode<T extends AbstractNode<T>, U extends unknown = unknown> {
  
  public depth = 0
  public owner: U | null = null
  public parent: AbstractNode<T> | null = null

  get attached () {
    return this.owner !== null
  }

  /**
   * 
   * @param {AbstractNode<T>} child 
   */
  redepthChild (child: AbstractNode<T>) {
    invariant(child.owner === this.owner, `The "child.depth" must be equal "this.owner"`)
    
    if (child.depth <= this.depth) {
      child.depth = this.depth + 1
      child.redepthChildren()
    }
  }
  
  redepthChildren () { }

  /**
   * 
   * @param {U} owner 
   */
  attach (owner: U) {
    invariant(owner !== null, `The argument "owner" cannot be null.`)

    this.owner = owner
  }

  
  detach () {
    invariant(this.owner !== null, `The this.owner cannot be null.`)
    this.owner = null
    invariant(parent === null || this.attached == this.parent!.attached)
  }

  /**
   * 
   * @param AbstractNode<T> child 
   */
  adoptChild (child: AbstractNode<T>) {
    invariant(child !== null, `The argument "child" cannot be null.`)
    invariant(child.parent === null)

    child.parent = this

    if (this.attached) {
      child.attach(this.owner!)
    }

    this.redepthChild(child)
  }

  /**
   * 
   * @param {AbstractNode<T>} child 
   */
  dropChild (child: AbstractNode<T>) {
    invariant(child !== null)
    invariant(child.parent === this)
    // invariant(child.attached === this.attached)
    child.parent = null
    
    if (this.attached) {
      child.detach()
    }
  }
}

