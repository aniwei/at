import { Equalable, bytes } from '@at/basic'
import { invariant } from '@at/utils'
import { ImageProviderKey } from './image-provider'
import { Engine } from '@at/engine'
import { ImageInfo, ImageStream, ImageStreamRefBox } from './image-stream'

/**
 * 图片缓存对象
 */
export interface BaseCachedImageFactory<T> {
  new (...rests: unknown[]): T
  create (...rests: unknown[]): T
  new (box: ImageStreamRefBox, sizeBytes?: number | null): T
  create (box: ImageStreamRefBox, sizeBytes?: number | null): T
}
export abstract class BaseCachedImage { 
  static create <T extends BaseCachedImage> (...rests: unknown[]): BaseCachedImage
  static create <T extends BaseCachedImage> (
    box: ImageStreamRefBox, 
    sizeBytes?: number | null
  ): BaseCachedImage {
    const BaseCachedImageFactory = this as unknown as BaseCachedImageFactory<T>
    return new BaseCachedImageFactory(box, sizeBytes)
  }

  public box: ImageStreamRefBox
  public sizeBytes: number | null

  constructor (box: ImageStreamRefBox, sizeBytes?: number | null) {
    this.box = box
    this.sizeBytes = sizeBytes ?? null
  }

  dispose () {}
}

//// => CachedImage
// 缓存图片
export class CachedImage extends BaseCachedImage {
  constructor (box: ImageStreamRefBox, sizeBytes: number | null) {
    super(box, sizeBytes)
  }
}

//// => PendingImage
// 加载中图片
export class PendingImage extends BaseCachedImage {
  static create (box: ImageStreamRefBox, stream: ImageStream) {
    return new PendingImage(box, stream) as PendingImage
  }

  public stream: ImageStream

  constructor (box: ImageStreamRefBox, stream: ImageStream) {
    super(box, 0)
    this.stream = stream
  }

  dispose () {
    this.box.delete(this.stream)
    super.dispose()
  }
}

//// => LiveImage
// 活跃图片
export class LiveImage extends BaseCachedImage {
  /**
   * 
   * @param {ImageStreamRefBox} box 
   * @param {VoidCallback} onRemove 
   * @param {number | null} sizeBytes 
   */
  constructor (
    box: ImageStreamRefBox, 
    onRemove: VoidFunction, 
    sizeBytes: number | null = null
    ) {
    super(box, sizeBytes)

    box.on('laststreamremovedcallbacks', () => {
      onRemove()
      this.dispose()
    })
  }

  dispose () {
    super.dispose()
    this.box.removeAllListeners('laststreamremovedcallbacks')
  }

  toString () {
    return `LiveImage(
      [completer]: ${this.box},
      [sizeBytes]: ${this.sizeBytes},
    )`
  }
}

export class ImageCachedStore {
  static create () {
    return new ImageCachedStore
  }

  public storage: Map<ImageProviderKey, BaseCachedImage> = new Map()

  public get size () {
    return this.storage.size
  }

  keys () {
    return this.storage.keys()
  }

  has (key: ImageProviderKey): boolean {
    return !!this.get(key)
  }

  set (key: ImageProviderKey, image: BaseCachedImage) {
    this.storage.set(key, image)
  }

  get (key: ImageProviderKey): BaseCachedImage | null {
    for (const [k, value] of this.storage) {
      if (key.equal(k)) {
        return value
      }
    }
    
    return null
  }

  put (key: ImageProviderKey, ifAbsent: () => BaseCachedImage) {
    if (!this.has(key)) {
      this.storage.set(key, ifAbsent())
    }
  }

  delete (key: ImageProviderKey) {
    for (const [k] of this.storage) {
      if (k.equal(key)) {
        this.storage.delete(k)
      }
    }
  }

  clear () {
    for (const [k, image] of this.storage) {
      image?.dispose()
      this.storage.delete(k)
    }
  }
}

//// => ImageCache
export class ImageCache<T extends ImageProviderKey = ImageProviderKey> {
  static create () {
    return new ImageCache()
  }

  public livingImages: ImageCachedStore = ImageCachedStore.create()
  public pendingImages: ImageCachedStore = ImageCachedStore.create()
  // 缓存图片
  public images: ImageCachedStore = ImageCachedStore.create()

  public listenedOnce: boolean = false
  public sizeBytes: number = 0

  public get livingCount () {
    return this.livingImages.size
  } 

  public get pendingCount () {
    return this.pendingImages.size
  }

  public get size () {
    return this.images.size
  }

  // => maximumSizeBytes
  // 图片最大字节
  protected _maximumSizeBytes: number = bytes.parse(Engine.env('IMAGE_CACHE_MAXIMUM_BYTES', '2m'))
  public get maximumSizeBytes () {
    return this._maximumSizeBytes
  }
  public set maximumSizeBytes (size: number) {
    invariant(size >= 0)
    
    if (size !== this.maximumSizeBytes) {
      this._maximumSizeBytes = size
    }

    if (this._maximumSizeBytes) {
      this.clear()
    }
  }

  // => _maximumSize
  // 图片最大缓存字节
  protected _maximumSize: number = bytes.parse(Engine.env('IMAGE_CACHE_MAXIMUM_SIZE', '100m'))
  public get maximumSize () {
    return this._maximumSize
  }
  public set maximumSize (size: number) {
    invariant(size >= 0)
    
    if (size !== this._maximumSize) {
      this._maximumSize = size
    }
    
    if (this.maximumSize === 0) {
      this.clear()
    }
  } 

  /**
   * @description 清除缓存
   */
  clear () {
    this.images.clear()
    this.pendingImages.clear()
  }

  /**
   * 处理图片
   * @param {ImageProvider} key 
   * @param {boolean} includeLive 
   * @return {boolean}
   */
  evict (key: T, includeLive: boolean = true): boolean {    
    // 删除活跃中的图片
    if (includeLive) {
      this.livingImages.get(key)?.dispose()
      this.livingImages.delete(key)
    }

    // 删除加载中图片
    const pending = this.pendingImages.get(key)
    this.pendingImages.delete(key)
    if (pending !== null) {
      pending.dispose()
      return true
    }

    // 删除缓存的图片
    const image = this.images.get(key)
    this.images.delete(key)
    if (image !== null) {
      this.sizeBytes -= image.sizeBytes as number
      image.dispose()
      return true
    }
   
    return false
  }

  /**
   * 创建缓存
   * @param {ImageProvider} key 
   * @param {AtCachedImage} image 
   */
  touch (key: T, image: CachedImage) {
    if (
      image.sizeBytes !== null && 
      this.maximumSizeBytes > image.sizeBytes && 
      this.maximumSize > 0
    ) {
      this.sizeBytes += image.sizeBytes
      this.images.set(key, image)
    } else {
      image.dispose()
    }
  }

  /**
   * 追踪活跃图片
   * @param {ImageProvider} key 
   * @param {ImageStreamRefBox} box 
   * @param {number | null} sizeBytes 
   */
  trackLiveImage (
    key: T, 
    box: ImageStreamRefBox, 
    sizeBytes: number | null
  ) {
    this.livingImages.put(key, () => {
      const image = LiveImage.create(box, () => this.livingImages.delete(key))
      image.sizeBytes ??= sizeBytes
      return image
    })
  }

  putIfAbsent (key: T, loader: () => ImageStreamRefBox): ImageStreamRefBox | null {   
    let pending: PendingImage | null = this.pendingImages.get(key) as PendingImage ?? null
    
    if (pending !== null) {
      return pending.box
    }
   
    let image: CachedImage | null = this.images.get(key)
    this.images.delete(key)
    
    if (image !== null) {
      this.trackLiveImage(key, image.box, image.sizeBytes)
      this.images.set(key, image)
      return image.box
    }

    let live = this.livingImages.get(key)
    if (live !== null) {
      this.touch(key, CachedImage.create(live.box, live.sizeBytes))
      return live.box
    }

    let result: ImageStreamRefBox

    result = loader() as ImageStreamRefBox
    this.trackLiveImage(key, result, null)
    
    this.listenedOnce = false
    let untrackedPendingImage: PendingImage | null
    
    const stream = ImageStream.create()

    stream.on('end', (info: ImageInfo | null, sync: boolean) => {
      let sizeBytes: number | null = null

      if (info !== null) {
        sizeBytes = info.sizeBytes
        info.dispose()
      }

      const image = CachedImage.create(result, sizeBytes)
      this.trackLiveImage(key, result, sizeBytes)

      if (untrackedPendingImage === null) {
        this.touch(key, image)
      } else {
        image.dispose()
      }

      let pending = untrackedPendingImage ?? this.pendingImages.get(key)
      this.pendingImages.delete(key)

      if (pending !== null) {
        pending?.dispose()
      }
      
      this.listenedOnce = true
    })
    
    if (this.maximumSize > 0 && this.maximumSizeBytes > 0) {
      this.pendingImages.set(key, PendingImage.create(result, stream))
    } else {
      untrackedPendingImage = PendingImage.create(result, stream)
    }
    
    result.put(stream)

    return result
  }

  statusForKey (key: T): ImageCacheStatus {
    return new ImageCacheStatus(
      this.pendingImages.has(key),
      this.images.has(key),
      this.livingImages.has(key),
    )
  }

  containsKey (key: T) {
    return (
      this.pendingImages.has(key)|| 
      this.images.has(key)
    )
  }
  
  clearLive () {
    for (const [key, image] of this.livingImages.storage) {
      image.dispose()
      this.livingImages.delete(key)
    }
  }

  checkCacheSize () {    
    while (
      this.sizeBytes > this.maximumSizeBytes || 
      this.images.size > this.maximumSize
    ) {
      const key = Array.from(this.images.keys())[0]

      const image = this.images.get(key) as CachedImage
      if (image) {
        this.sizeBytes -= image.sizeBytes!
      }
      image.dispose()
      this.images.delete(key)
    }
  }
}

// => ImageCacheStatus
export class ImageCacheStatus extends Equalable<ImageCacheStatus> {
  public live: boolean
  public pending: boolean
  public keepAlive: boolean

  public get tracked () {
    return this.pending || this.keepAlive || this.live
  }

  public get untracked () {
    return !this.pending && !this.keepAlive && !this.live
  } 

  constructor (
    pending: boolean, 
    keepAlive: boolean, 
    live: boolean
  ) {
    super()
    this.pending = pending
    this.keepAlive = keepAlive
    this.live = live
  }

  equal (other: ImageCacheStatus | null) {
    return (
      other instanceof ImageCacheStatus &&
      other.keepAlive === this.keepAlive &&
      other.pending === this.pending &&
      other.live === this.live
    )
  }

  notEqual (other: ImageCacheStatus | null): boolean {
    return !this.equal(other)
  }
  
  toString () {
    return `ImageCacheStatus(
      [pending]: ${this.pending}, 
      [keepAlive]: ${this.keepAlive}, 
      [live]: ${this.live}
    )`
  }
}
