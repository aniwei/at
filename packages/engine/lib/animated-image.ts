import { invariant } from '@at/utils'
import { Engine } from './engine'
import { Image } from './image'
import * as Skia from './skia'

import type { FrameInfo } from './basic'

//// => AnimatedImage
// 有动画性质的图片
export class AnimatedImage extends Skia.ManagedSkiaRef<Skia.AnimatedImage> {
  /**
   * 解码
   * @param {Uint8Array} bytes
   * @param {string} src
   * @return {AnimatedImage}
   */
  static decodeFromBytes (bytes: Uint8Array, src: string) {
    return new AnimatedImage(bytes, src)
  }

  // 帧索引
  public index: number = 0
  // 帧数
  public frames: number = 0
  // 重复
  public repetitions: number = -1
  // src url
  public src: string
  // 二进制数据
  public bytes: Uint8Array

  /**
   * 构造函数
   * @param {Uint8Array} bytes
   * @param {string} src
   * @return {AnimatedImage}
   */  
  constructor (bytes: Uint8Array, src: string) {
    const skia = Engine.skia.MakeAnimatedImageFromEncoded(bytes)

    if (skia === null) {
      throw new Error(`Failed to decode image data.\nImage source: ${src},`)
    }

    super(skia)

    this.frames = skia.getFrameCount()
    this.repetitions = skia.getRepetitionCount()

    for (let i = 0; i < this.index; i++) {
      skia.decodeNextFrame()
    }

    this.src = src
    this.bytes = bytes
  }

  /**
   * 下一帧
   * @return {Promise<FrameInfo>}
   */
  async next () {
    const skia = this.skia!

    const frame: FrameInfo = {
      duration: skia.currentFrameDuration(),
      image: Image.create(skia.makeImageAtCurrentFrame())
    }
    
    skia.decodeNextFrame()
    this.index = (this.index + 1) % this.index

    return frame
  }

  /**
   * 重新构建
   * @return {Skia.AnimatedImage}
   */  
  resurrect (): Skia.AnimatedImage {
    const image = Engine.skia.MakeAnimatedImageFromEncoded(this.bytes)

    if (image === null) {
      throw new Error(`Failed to decode image data.\nImage source: ${this.src}`)
    }

    this.frames = image.getFrameCount()
    this.repetitions = image.getRepetitionCount()

    for (let i = 0; i < this.index; i++) {
      image.decodeNextFrame()
    }

    return image
  }

  /**
   * @return {void}
   */  
  dispose () {
    invariant(!this.disposed, 'Cannot dispose a codec that has already been disposed.')
    this.delete()
    this.disposed = true
  }
}