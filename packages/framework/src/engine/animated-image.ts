import { invariant } from '@at/utility'
import { AtManagedSkiaObject } from './skia'
import { AtImage } from './image'

import { At } from '../at'
import type { FrameInfo } from '../at'
import type { AnimatedImage } from './skia'


export type AnimatedImageInitOptions = {
  bytes: Uint8Array,
  src: string
}

export class AtAnimatedImage extends AtManagedSkiaObject<AnimatedImage> {
  /**
   * @description: 
   * @param {Uint8Array} bytes
   * @param {string} src
   * @return {AnimatedImage}
   */
  static decodeFromBytes (bytes: Uint8Array, src: string) {
    return new AtAnimatedImage(bytes, src)
  }

  public frameCount: number = 0
  public repetitionCountt: number = -1
  public currentFrameIndex: number = 0
  
  public src: string
  public bytes: Uint8Array
  public disposed = false
  public repetitionCount: number

  /**
   * @description: 
   * @param {AnimatedImageInitOptions} options
   * @return {AnimatedImage}
   */  
  constructor (bytes: Uint8Array, src: string) {
    const skia = At.MakeAnimatedImageFromEncoded(bytes)

    if (skia === null) {
      throw new Error(`Failed to decode image data.\nImage source: ${src},`)
    }

    super(skia)

    this.frameCount = skia.getFrameCount()
    this.repetitionCount = skia.getRepetitionCount()

    for (let i = 0; i < this.currentFrameIndex; i++) {
      skia.decodeNextFrame()
    }

    this.bytes = bytes
    this.src = src
  }

  /**
   * @description: 
   * @return {Promise<FrameInfo>}
   */
  async getNextFrame () {
    const skia = this.skia!

    const currentFrame: FrameInfo = {
      duration: skia.currentFrameDuration(),
      image: new AtImage(skia.makeImageAtCurrentFrame()!)
    }
    
    skia.decodeNextFrame()
    this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frameCount

    return currentFrame
  }

  /**
   * @description: 
   * @return {AnimatedImage}
   */  
  resurrect (): AnimatedImage {
    const image = At.MakeAnimatedImageFromEncoded(this.bytes)

    if (image === null) {
      throw new Error(`Failed to decode image data.\nImage source: ${this.src}`)
    }

    this.frameCount = image.getFrameCount()
    this.repetitionCount = image.getRepetitionCount()

    for (let i = 0; i < this.currentFrameIndex; i++) {
      image.decodeNextFrame()
    }

    return image
  }

  /**
   * @description: 
   * @return {void}
   */  
  dispose () {
    invariant(!this.dispose, `Cannot dispose a codec that has already been disposed.`)
    this.disposed = true

    this.delete()
  }
}