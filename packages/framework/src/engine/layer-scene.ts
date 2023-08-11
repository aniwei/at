import { AtImage } from './image'
import { AtRootLayer } from './layer'
import { AtLayerTree } from './layer-tree'

export class AtLayerScene {
  static create (root: AtRootLayer) {
    return new AtLayerScene(root)
  }

  public tree: AtLayerTree

  /**
   * 构造函数
   * @param {AtRootLayer} root 
   */
  constructor (root: AtRootLayer) {
    this.tree = new AtLayerTree(root)
  }

  /**
   * 转成图片
   * @param {number} width 
   * @param {number} height 
   * @returns {AtImage}
   */
  toImage (width: number, height: number): AtImage {
    const picture = this.tree.flatten()
    return picture.toImage(width, height)
  }

  /**
   * 释放资源
   */
  dispose () {}
}