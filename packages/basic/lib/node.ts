import { invariant } from '@at/utils'

//// => AbstractNode
export abstract class AbstractNode<T extends AbstractNode<T>> {
  // => attached
  // 是否挂载
  get attached () {
    return this.owner !== null
  }
  
  // => owner
  protected _owner: unknown | null = null
  public get owner () {
    return this._owner
  }
  public set owner (owner: unknown | null) {
    this._owner = owner
  }

  public depth = 0
  public parent: T | null = null

  /**
   * 
   * @param {T} child 
   */
  redepthChild (child: T) {
    invariant(child.owner === this.owner, 'The "child.depth" must be equal "this.owner"')
    
    if (child.depth <= this.depth) {
      child.depth = this.depth + 1
      child.redepthChildren()
    }
  }
  
  redepthChildren () { }

  /**
   * 挂载
   * @param {U} owner 
   */
  attach (owner: unknown) {
    invariant(owner !== null, 'The argument "owner" cannot be null.')
    this.owner = owner
  }

  /**
   * 卸载
   */
  detach () {
    invariant(this.owner !== null, 'The "this.owner" cannot be null.')
    this.owner = null
    invariant(parent === null || this.attached == this.parent!.attached)
  }

  /**
   * 
   * @param {T} child 
   */
  adoptChild (child: T) {
    invariant(child !== null, `The argument "child" cannot be null.`)
    invariant(child.parent === null)

    child.parent = this as unknown as T

    if (this.attached) {
      child.attach(this.owner)
    }

    this.redepthChild(child)
  }

  /**
   * 
   * @param {AbstractNode<T>} child 
   */
  dropChild (child: T) {
    invariant(child.parent === this as unknown as T, 'The "child.parent" cannot refer to itself.')
    child.parent = null
    
    if (this.attached) {
      child.detach()
    }
  }
}

