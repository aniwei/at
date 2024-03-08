import { invariant } from '@at/utils'
import { Rect } from '@at/geometry'

import { Image } from './image'
import { Snapshot } from './snapshot'
import { Engine } from './engine'

import * as Skia from './skia'

export class Picture extends Skia.ManagedSkiaRef<Skia.Picture> {
  static create (
    picture: Skia.Picture,
    cullRect?: Rect | null,
    snapshot?: Snapshot | null
  ) {
    return new Picture(picture, cullRect ?? null, snapshot ?? null)
  }

  // => skia
  public get skia () {
    invariant(super.skia)
    return super.skia
  }

  public disposed: boolean = false
  public cullRect: Rect | null = null
  public approximateBytesUsed: number = 0
  public isResurrectionExpensive: boolean = true
  public snapshot: Snapshot | null = null

  /**
   * @description: 
   * @param {PictureOptions} options
   * @return {*}
   */  
  constructor (
    picture: Skia.Picture,
    cullRect: Rect | null = null,
    snapshot: Snapshot | null = null
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
   * 转位图
   * @param {number} width
   * @param {number} height
   * @return {Image}
   */
  toImage (width: number, height: number): Image {
    invariant(!this.disposed, 'The Picture object cannot be disposed when export to image.')
    const surface: Skia.Surface = Engine.skia.MakeSurface(width, height)!
    const canvas = surface.getCanvas()
    
    // canvas.scale(2, 2)
    invariant(this.skia)
    canvas.drawPicture(this.skia)
    
    const skia: Skia.Image = surface.makeImageSnapshot()
    surface.dispose()
    return Image.create(skia)
  }

  /**
   * 重新创建
   * @return {IPicture}
   */  
  resurrect () {
    invariant(!this.disposed, `The Picture object cannot be disposed.`)
    invariant(this.snapshot, `The Picture object cannot be disposed.`)
    return this.snapshot.toPicture()
  }

  /**
   * 释放
   * @return {void}
   */  
  dispose () {
    this.snapshot?.dispose()  
    this.disposed = true
    this.delete()
  }
}