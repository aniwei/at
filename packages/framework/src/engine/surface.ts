/*
 * @author: Aniwei
 * @date: 2022-08-09 10:04:53
 */
import { invariant } from '@at/utils'
import { At, AtImage, AtLayerTree, AtPaint, Subscribable, WebGLMajorVersion } from '../at'
import { AtCanvas } from './canvas'

import { Offset, Size } from '../basic/geometry'
import type { Surface } from './skia'

export type SubmitCallback = (image: AtImage) => void 

export class AtSurfaceFrame extends Subscribable {
  public get canvas () {
    invariant(this.surface)
    return this.surface.canvas
  }

  public surface: AtSurface | null
  public caches: null = null
  
  /**
   * 
   * @param skia 
   * @param onSubmit 
   */
  constructor (surface: AtSurface) {
    super()
    
    this.surface = surface
  }

  raster (layerTree: AtLayerTree, ignoreCache: boolean = false) {
    layerTree.preroll(this, ignoreCache)
    layerTree.paint(this, ignoreCache)
  }

  dispose () {
    this.surface?.dispose()
    this.surface = null
  }

  submit (): AtImage {
    invariant(this.surface)
    const image = this.surface.snapshot()
    invariant(image)
    return AtImage.create(image)
  }
}


export class AtSurfaceOnScreenFrame extends AtSurfaceFrame {
  public get canvas () {
    invariant(this.surface)
    return this.surface.canvas
  }

  /**
   * 
   * @returns 
   */
  flush () {
    const image = this.submit()
    this.publish(image)
  }
}


export class AtSurface {
  static tryCreate (size: Size, canvas: HTMLCanvasElement) {
    try {
      return At.MakeWebGLCanvasSurface(canvas as HTMLCanvasElement) as Surface
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${error.message}`)
    }

    for (const ver of [WebGLMajorVersion.WebGL2, WebGLMajorVersion.WebGL1]) {
      const glContext = At.GetWebGLContext(canvas as HTMLCanvasElement, {
        antialias: 0,
        majorVersion: ver
      })

      if (glContext !== 0) {
        const grContext = At.MakeWebGLContext(glContext)
        if (grContext === null) {
          continue
        }

        const surface = At.MakeOnScreenGLSurface(
          grContext!,
          Math.ceil(size.width),
          Math.ceil(size.height),
          At.ColorSpace.SRGB,
        )

        return surface as Surface
      }
    }

    throw new Error(`Unsupport WebGL.`)
  }

  static tryCreateSofewareSurface (canvas: HTMLCanvasElement) {
    try {
      // @ts-ignore
      canvas.tagName = 'CANVAS'
    } catch (error) {}
    return At.MakeSWCanvasSurface(canvas as HTMLCanvasElement) as Surface
  }

  static fromSkia (skia: Surface) {
    return new AtSurface(skia)
  }
  
  get canvas () {
    invariant(!this.disposed, 'Attempting to use the canvas of a disposed surface')
    invariant(this.skia)
    return new AtCanvas(this.skia.getCanvas())
  }

  get width () {
    invariant(this.skia)
    return this.skia.width()
  }

  get height () {
    invariant(this.skia)
    return this.skia.height()
  } 

  protected skia: Surface | null
  protected disposed: boolean = false

  constructor (surface: Surface) {
    this.skia = surface
  }

  acquireFrame (size?: Size): AtSurfaceFrame {
    invariant(this.skia, `The member property "this.skia" cannot be null.`)
    invariant(this.skia !== null)

    const surface = new AtSurface(this.skia.makeSurface({
      ...this.skia?.imageInfo(),
      width: size ? size.width : this.width,
      height: size ? size.height : this.height
    }))
    
    const frame = new AtSurfaceFrame(surface)
    return frame
  }
  
  acquireOnScreenFrame (): AtSurfaceOnScreenFrame {
    invariant(this.skia, `The member property "this.skia" cannot be null.`)
    invariant(this.skia !== null)

    const surface = new AtSurface(this.skia.makeSurface({
      ...this.skia?.imageInfo(),
      width: this.width,
      height: this.height
    }))
    
    const frame = new AtSurfaceOnScreenFrame(surface)
    frame.once((image) => this.flush(image))

    return frame
  }

  snapshot () {
    return this.skia?.makeImageSnapshot()
  }

  flush (image: AtImage) {
    const paint = AtPaint.create()
    this.canvas.drawImage(image, Offset.zero, paint)
    this.skia?.flush()
  }

  dispose () {    
    this.skia?.delete()
    this.skia = null
    this.disposed = true
  }
}
