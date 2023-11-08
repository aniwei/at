import { invariant } from '@at/utils'
import { AtEngine } from './engine'
import { Image } from './image'
import * as Skia from './skia'

import type { FrameInfo } from './basic'


export class AnimatedImage extends Skia.ManagedSkiaRef<Skia.AnimatedImage> {
  /**
   * @param {Uint8Array} bytes
   * @param {string} src
   * @return {AnimatedImage}
   */
  static decodeFromBytes (bytes: Uint8Array, src: string) {
    return new AnimatedImage(bytes, src)
  }

  public index: number = 0
  public frames: number = 0
  public repetitions: number = -1
  
  public src: string
  public bytes: Uint8Array
  public disposed = false

  /**
   * @description: 
   * @param {AnimatedImageInitOptions} options
   * @return {AnimatedImage}
   */  
  constructor (bytes: Uint8Array, src: string) {
    const skia = AtEngine.skia.MakeAnimatedImageFromEncoded(bytes)

    if (skia === null) {
      throw new Error(`Failed to decode image data.\nImage source: ${src},`)
    }

    super(skia)

    this.frames = skia.getFrameCount()
    this.repetitions = skia.getRepetitionCount()

    for (let i = 0; i < this.index; i++) {
      skia.decodeNextFrame()
    }

    this.bytes = bytes
    this.src = src
  }

  /**
   * @description: 
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
   * @return {Skia.AnimatedImage}
   */  
  resurrect (): Skia.AnimatedImage {
    const image = AtEngine.skia.MakeAnimatedImageFromEncoded(this.bytes)

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
    this.disposed = true

    this.delete()
  }
}