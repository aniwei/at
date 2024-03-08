import { Image } from './image'
import { RootLayer } from './layer'
import { LayerTree } from './layer-tree'

export class LayerScene {
  static create (root: RootLayer) {
    return new LayerScene(root)
  }

  public tree: LayerTree

  /**
   * 构造函数
   * @param {RootLayer} root 
   */
  constructor (root: RootLayer) {
    this.tree = new LayerTree(root)
  }

  /**
   * 转成图片
   * @param {number} width 
   * @param {number} height 
   * @returns {AtImage}
   */
  toImage (width: number, height: number): Image {
    const picture = this.tree.flatten()
    return picture.toImage(width, height)
  }

  /**
   * 释放资源
   */
  dispose () {}
}