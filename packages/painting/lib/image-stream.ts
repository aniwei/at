import { Equalable, EventEmitter } from '@at/basic'
import { FrameInfo, Image, ImageCodec } from '@at/engine'
import { invariant, tryCatch } from '@at/utils'


/**
 * @description: 图片下载事件结构
 */
export interface ImageChunk {
  cumulativeBytesLoaded: number
  expectedTotalBytes: number | null
}

export type ImageEndHandle = (image: ImageInfo, synchronous: boolean) => void
export type ImageChunkHandle = (chunk: ImageChunk) => void
export type ImageErrorHandle = (error: any) => void


//// => ImageInfo
// 图片信息
export class ImageInfo extends Equalable<ImageInfo> {
  static create (image: Image, scale: number = 1.0) {
    return new ImageInfo(image, scale)
  }

  public image: Image
  public scale: number 
  
  public get sizeBytes () {
    return this.image.height * this.image.width * 4
  } 

  constructor (image: Image, scale: number = 1.0) {
    super()
    this.image = image
    this.scale = scale
  }
  
  clone (): ImageInfo {
    return new ImageInfo(
      this.image.clone() as Image,
      this.scale
    )
  }

  isCloneOf (other: ImageInfo): boolean {
    return (
      other.image.isCloneOf(this.image) &&
      other.scale === this.scale 
    )
  }

  equal (other: ImageInfo | null) {
    return (
      other instanceof ImageInfo &&
      other.scale === this.scale &&
      other.image === this.image
    )
  }

  notEqual (other: ImageInfo | null): boolean {
    return !this.equal(other)
  }

  dispose () {
    this.image.dispose()
  }

  toString () {
    return `ImageInfo(
      [image]: ${this.image},
      [scale]: ${this.scale}
    )`
  }
}


//// => ImageStream
// 图片流
export class ImageStream extends EventEmitter<'end' | 'data' | 'error'> {
  static create () {
    return new ImageStream()
  }

  // => key
  public get key () {
    return this.box
  }

  // => box
  private _box: ImageStreamRefBox | null = null
  public get box () {
    return this._box
  }
  public set box (box: ImageStreamRefBox | null) {
    if (box !== null) {
      this._box = box
      box.put(this)
    }
  }

  // => image
  public set image (image: ImageInfo) {
    if (this.listenerCount('end') > 0) {
      try {
        this.emit('end', image.clone())
      } catch (error: any) {
        this.emit('error', error)
      }
    }
  }

  put (chunk: ImageChunk) {
    if (this.listenerCount('data') > 0) {
      this.emit('data', chunk)
    }
  }
}

//// => ImageStreamRefBox
// 图片流下载器
export interface ImageStreamRefBoxFactory<T> {
  new (...rests: unknown[]) : T,
  create (...rests: unknown[]) : T
}
export class ImageStreamRefBox extends EventEmitter<'laststreamremovedcallbacks'> {
  static create <T extends ImageStreamRefBox> (...rests: unknown[]): ImageStreamRefBox {
    const ImageStreamRefBoxFactory = this as unknown as ImageStreamRefBoxFactory<T>
    return new ImageStreamRefBoxFactory(...rests)
  }

  // => image
  protected _image: ImageInfo | null = null
  public get image () {
    return this._image
  }
  public set image (image: ImageInfo | null) {
    image ??= null
    if (this._image === null || this._image?.notEqual(image)) {
      this._image?.dispose()
      this._image = image

      if (image !== null && this.streams.length > 0) {
        for (const stream of this.streams) {
          stream.image = image.clone()
        }
      }
    }
  }

  protected streams: ImageStream[] = []

  public disposed: boolean = false
  public keepAliveHandles: number = 0
  public hadAtLeastOneStream: boolean = false

  keepAlive () {
    this.keepAliveHandles++
  }
  
  reveive (chunk: ImageChunk) {
    invariant(!this.disposed)

    if (this.streams.length > 0) {         
      for (const stream of this.streams) {
        stream.put(chunk)
      }
    }
  }

  put (stream: ImageStream) {
    invariant(!this.disposed)

    this.hadAtLeastOneStream = true
    this.streams.push(stream)

    if (this.image !== null) {
      stream.image = this.image.clone()
    }
  }

  delete (stream: ImageStream) {
    invariant(!this.disposed)

    const index = this.streams.findIndex(s => stream === s)
    if (index > -1) {
      this.streams.splice(index, 1)
    }

    if (this.streams.length === 0) {
      this.emit('laststreamremovedcallbacks')
      this.dispose()
    }
  }

  dispose () {
    if (
      !this.hadAtLeastOneStream || 
      this.disposed || 
      this.streams.length > 0 || 
      this.keepAliveHandles !== 0
    ) {
      return
    }

    this.image?.dispose()
    this.image = null
    this.disposed = true
  }
}

//// => MultiFrameImageStreamRefBox
// 多帧图片下载器
export class MultiFrameImageStreamRefBox extends ImageStreamRefBox {
  static create (promise: Promise<ImageCodec>, scale: number) {
    return new MultiFrameImageStreamRefBox(promise, scale)
  }

  // => codec
  // 图片解码
  public _codec: ImageCodec | null = null
  public get codec () {
    invariant(this._codec)
    return this._codec
  }
  public set codec (codec: ImageCodec) {
    if (this._codec !== codec) {
      this._codec?.dispose()
      this._codec = codec
      
      if (this.streams.length > 0) {
        this.decodeAndSchedule()
      }
    }
  }

  // => 准备就绪
  public get prepared () {
    tryCatch(() => {
      return !!this.codec
    })
    return false
  }

  // => isFirst
  // 是否是第一帧
  public get isFirst (): boolean {
    return this.duration === null
  }

  // => duration
  protected _duration: number | null = null
  public get duration () {
    invariant(this._duration)
    return this._duration
  }
  public set duration (duration: number) {
    if (this._duration !== duration) {
      this._duration = duration
    }
  }

  // => timestamp
  protected _timestamp: number | null = null
  public get timestamp () {
    invariant(this._timestamp)
    return this._timestamp
  }
  public set timestamp (timestamp: number) {
    if (this._timestamp !== timestamp) {
      this._timestamp = timestamp
    }
  }

  // => image
  public set image (image: ImageInfo | null) {
    if (super.image === null || super.image.notEqual(image)) {
      super.image = image
      if (image !== null) {
        this.emitted++
      }
    }
  }
  public get image () {
    return super.image
  }

  public scale: number
  public emitted: number = 0
  public frame: FrameInfo | null = null
  public callbackScheduled: boolean = false

  constructor (promise: Promise<ImageCodec>, scale: number) {
    super()    
    promise.then((codec: ImageCodec) => {
      this.codec = codec
      if (this.streams.length > 0) {
        this.decodeAndSchedule()  
      }
    })

    this.scale = scale 
  }

  handleFrame = (timestamp: number) => {
    this.callbackScheduled = false

    if (this.streams.length > 0) {
    
      if (
        this.isFirst || 
        this.hasFrameDurationPassed(timestamp)
      ) {
        invariant(this.frame)
        const image = ImageInfo.create(this.frame.image.clone(), this.scale)
        
        this.image = image
        
        this.timestamp = timestamp
        this.duration = this.frame.duration
        this.frame.image.dispose()
        this.frame = null
        
        const completed = Math.floor(this.emitted / this.codec.frames)
  
        if (
          this.codec.repetitions === -1 || 
          completed <= this.codec.repetitions
        ) {
          this.decodeAndSchedule()
        }
      }
    }
  }

  async decodeAndSchedule () {
    this.frame?.image.dispose()
    this.frame = null

    this.codec.next().then(image => {
      this.frame = image
      if (this.codec.frames === 1 && this.streams.length > 0) {
        invariant(this.frame)
        this.image = ImageInfo.create(this.frame.image.clone(), this.scale)
        this.frame.image.dispose()
        this.frame = null
      } else {
        this.schedule()
      }
    })
  }


  hasFrameDurationPassed (timestamp: number): boolean {
    invariant(this.duration)
    invariant(this.duration)
    return timestamp - this.timestamp >= this.duration
  }

  
  schedule () {
    if (!this.callbackScheduled) {
      this.callbackScheduled = true
      // @TODO      
    }
  }

  put (stream: ImageStream) {
    if (
      this.prepared &&
      this.streams.length === 0 && (
        this.image === null || 
        this.codec.frames > 1
      )
    ) {
      this.decodeAndSchedule()
    }
    super.put(stream)
  }

  /**
   * @param stream 
   */
  delete (stream: ImageStream) {
    super.delete(stream)
    // @TODO
  }

  dispose () {
    super.dispose()
    if (this.disposed) {}
  }
}