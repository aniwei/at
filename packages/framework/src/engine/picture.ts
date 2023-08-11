/*
 * @author: Aniwei
 * @date: 2022-07-04 12:10:21
 */
import { invariant } from 'ts-invariant'
import { Rect } from '../basic/geometry'
import { AtImage } from './image'
import { AtSnapshot } from './canvas'
import { AtManagedSkiaObject } from './skia'
import { At } from '../at'

import type { Image, Picture, Surface } from './skia'

export class AtPicture extends AtManagedSkiaObject<Picture> {
  static create (
    picture: Picture,
    cullRect?: Rect,
    snapshot?: AtSnapshot
  ) {
    return new AtPicture(picture, cullRect, snapshot)
  }

  public disposed: boolean = false
  public cullRect: Rect | null = null
  public approximateBytesUsed: number = 0
  public isResurrectionExpensive: boolean = true
  public snapshot: AtSnapshot | null = null

  /**
   * @description: 
   * @param {PictureOptions} options
   * @return {*}
   */  
  constructor (
    picture: Picture,
    cullRect: Rect | null = null,
    snapshot: AtSnapshot | null = null
  ) {    
    invariant(
      snapshot !== null,
      'If the browser does not support FinalizationRegistry (WeakRef), then we must have a picture snapshot to be able to resurrect it.',
    )

    super(picture)

    this.cullRect = cullRect
    this.snapshot = snapshot
  }

  /**
   * @description: 
   * @return {void}
   */  
  dispose () {
    invariant(!this.disposed, 'AtPicture object has been disposed.')
    this.snapshot?.dispose()  
    this.delete()
    this.disposed = true
  }

  /**
   * @param {number} width
   * @param {number} height
   * @return {Image}
   */
  toImage (width: number, height: number): AtImage {
    invariant(!this.disposed, `The AtPicture object cannot be disposed.`)
    const surface: Surface = At.MakeSurface(width, height)!
    const canvas = surface.getCanvas()
    
    // canvas.scale(2, 2)
    invariant(this.skia)
    canvas.drawPicture(this.skia)
    
    const skia: Image = surface.makeImageSnapshot()
    surface.dispose()
    return new AtImage(skia)
  }

  /**
   * @description: 
   * @return {IPicture}
   */  
  resurrect () {
    invariant(!this.disposed, `The AtPicture object cannot be disposed.`)
    return this.snapshot!.toPicture()
  }

  /**
   * @description: 
   * @return {void}
   */  
  delete () {
    if (!this.disposed) {
      super.delete()
    }
  }
}