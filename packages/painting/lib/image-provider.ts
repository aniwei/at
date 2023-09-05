import { invariant } from 'ts-invariant'
import { Size } from '../basic/geometry'
import { AtImage } from '../engine/image'
import { EventEmitter } from '../basic/events'
import { AtAssetBundle } from '../basic/asset-boundle'

import { At, Codec, FrameInfo, VoidCallback } from '../at'
import type { TextDirection } from '../engine/skia'

/**
 * @description: 图片解码
 */
export type ImageDecodeCallback = (
  bytes: Uint8Array, 
  cacheWidth: number | null,
  cacheHeight: number | null,
  allowUpscaling: boolean
) => Promise<Codec>

/**
 * @description: 图片下载事件结构
 */
export type ImageChunkEvent = {
  cumulativeBytesLoaded: number
  expectedTotalBytes: number | null
}

export type ImageListener = (image: AtImageInfo, synchronous: boolean) => void
export type ImageChunkListener = (chunk: ImageChunkEvent) => void
export type ImageErrorListener = (error: any) => void


export type AtImageConfigurationOptions = {
  bundle?: AtAssetBundle | null,
  devicePixelRatio?: number | null,
  textDirection?: TextDirection,
  size?: Size | null,
}

// => AtImageConfiguration
export class AtImageConfiguration {
  static get empty () {
    return new AtImageConfiguration()
  }
  /**
   * 创建图片配置
   * @param {options} optons
   * @return {*}
   */
  static create (options: AtImageConfigurationOptions) {
    return new AtImageConfiguration(
      options?.bundle,
      options?.devicePixelRatio,
      options?.textDirection,
      options?.size
    )
  }

  public size: Size | null
  public bundle: AtAssetBundle | null
  public devicePixelRatio: number | null
  public textDirection: TextDirection
  
  /**
   * 构造函数
   * @param {AssetBundle} bundle
   * @param {number} devicePixelRatio
   * @param {Locale} locale
   * @param {TextDirection} textDirection
   * @param {Size} size
   */
  constructor (
    bundle: AtAssetBundle | null = null,
    devicePixelRatio: number | null = At.globalSettings.devicePixelRatio,
    textDirection: TextDirection = At.TextDirection.LTR,
    size: Size | null = null,
  ) {
    
    this.bundle = bundle
    this.devicePixelRatio = devicePixelRatio
    this.textDirection = textDirection
    this.size = size
  }

  /**
   * @param bundle 
   * @param devicePixelRatio 
   * @param textDirection 
   * @param {Size | null} size 
   * @return {AtImageConfiguration} 
   */
  copyWith (
    bundle: AtAssetBundle | null = null,
    devicePixelRatio: number | null = At.globalSettings.devicePixelRatio,
    textDirection: TextDirection | null = null,
    size: Size | null = null,
  ): AtImageConfiguration  {
    return new AtImageConfiguration(
      bundle ?? this.bundle,
      devicePixelRatio ?? this.devicePixelRatio,
      textDirection ?? this.textDirection,
      size ?? this.size
    )
  }

  /**
   * @description: 判断是否相等
   * @param {AtImageConfiguration} other
   * @return {*}
   */  
  equal (other: AtImageConfiguration | null) {
    return (
      other instanceof AtImageConfiguration &&
      other.bundle === this.bundle &&
      other.devicePixelRatio === this.devicePixelRatio &&
      other.textDirection === this.textDirection &&
      other.size?.equal(this.size)
    )
  }

  notEqual (value: AtImageConfiguration | null): boolean {
    throw !this.equal(value)
  }
  
  toString () {
    return `AtImageConfiguration(bundle: ${this.bundle}, devicePixelRatio: ${this.devicePixelRatio}, textDirection: ${this.textDirection}, size: ${this.size})`
  }
}


// => AtImageInfo
/**
 * @description: 图片信息
 * @return {*}
 */
export class AtImageInfo {
  public image: AtImage
  public scale: number 
  
  public get sizeBytes () {
    return this.image.height * this.image.width * 4
  } 

  constructor (image: AtImage, scale: number = 1.0) {
    invariant(image !== null, `The argument image cannot be null.`)
    invariant(scale !== null, `The argument image cannot be null.`)

    this.image = image
    this.scale = scale
  }
  
  clone (): AtImageInfo {
    return new AtImageInfo(
      this.image.clone(),
      this.scale
    )
  }

  isCloneOf (other: AtImageInfo): boolean {
    return (
      other.image.isCloneOf(this.image) &&
      other.scale === this.scale 
    )
  }

  equal (other: AtImageInfo) {
    return (
      other instanceof AtImageInfo &&
      other.scale === this.scale &&
      other.image === this.image
    )
  }

  dispose () {
    this.image.dispose()
  }

  toString () {
    return `AtImageInfo()`
  }
}

// => AtImageStream
/**
 * @description: 图片时间流
 * @return {*}
 */
export class AtImageStream extends EventEmitter<'image' | 'chunk' | 'error'> {
  /**
   * @description: 绑定的 completer
   * @return {*}
   */  
  public get key () {
    return this.completer
  }

  private _completer: AtImageStreamCompleter | null = null
  public get completer () {
    return this._completer
  }
  public set completer (completer: AtImageStreamCompleter | null) {
    if (completer !== null) {
      completer.add(this)
    }
    this._completer = completer
  }

  /**
   * 
   * @param image 
   * @param synchronous 
   */
  setImage (image: AtImageInfo, synchronous: boolean) {
    if (this.listenerCount('image') > 0) {
      try {
        this.emit('image', image.clone(), synchronous)
      } catch (error: any) {
        if (!this.emit('error', error)) {
          throw error
        }
      }
    }
  }

  setChunk (event: ImageChunkEvent) {
    if (this.listenerCount('chunk') > 0) {
      this.emit('chunk', event)
    }
  }
}

// => AtImageStreamCompleter
/**
 * @description: 
 * @return {*}
 */
export class AtImageStreamCompleter extends EventEmitter<'lastStreamRemovedCallbacks'> {
  protected streams: AtImageStream[] = []
  protected image: AtImageInfo | null = null

  public disposed = false
  public keepAliveHandles: number = 0
  public hadAtLeastOneStream: boolean = false

  public get hasStream () {
    return this.streams.length
  }

  keepAlive () {
    this.keepAliveHandles++
  }

  setImage (image: AtImageInfo) {
    this.checkIsDisposed()
    this.image?.dispose()
    this.image = image

    if (this.hasStream) {
      const streams = Array.from(this.streams)
      for (const stream of streams) {
        stream.setImage(image.clone(), false)
      }
    }
  }
  
  setChunk (event: ImageChunkEvent) {
    this.checkIsDisposed()

    if (this.hasStream) {
      const streams = this.streams
         
      for (const stream of streams) {
        stream.setChunk(event)
      }
    }
  }

  add (stream: AtImageStream) {
    this.checkIsDisposed()
    this.hadAtLeastOneStream = true
    this.streams.push(stream)

    if (this.image !== null) {
      stream.setImage(this.image.clone(), false)
    }
  }

  remove (stream: AtImageStream) {
    this.checkIsDisposed()

    const index = this.streams.findIndex(s => stream === s)
    if (index > -1) {
      this.streams.splice(index, 1)
    }

    if (this.streams.length === 0) {
      this.emit('lastStreamRemovedCallbacks')
      this.dispose()
    }
  }

  checkIsDisposed () {
    if (this.disposed) {
      throw new Error(`Stream has been disposed.`)
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

// => AtMultiFrameImageStreamCompleter
export class AtMultiFrameImageStreamCompleter extends AtImageStreamCompleter {
  public scale: number
  public codec: Codec | null = null
  public nextFrame: FrameInfo | null = null
  public shownTimestamp!: number
  public frameDuration!: number
  public framesEmitted = 0
  public frameCallbackScheduled: boolean = false

  public get isFirstFrame (): boolean {
    return this.frameDuration === null
  }

  constructor (promise: Promise<Codec>, scale: number) {
    super()
    invariant(promise !== null, `The argument "promise" cannot be null.`)
    
    promise.then((codec: Codec) => {
      this.codec = codec
      if (this.hasStream) {
        this.decodeNextFrameAndSchedule()  
      }
    }).catch(error => {
      throw error
    })

    this.scale = scale 
  }

  handleAppFrame = (timestamp: number) => {
    this.frameCallbackScheduled = false

    if (!this.hasStream) {
      return
    }

    invariant(this.nextFrame !== null, `The "this.nextFrame" cannot be null.`)
    invariant(this.codec !== null, `The "this.codec" cannot be null.`)

    if (
      this.isFirstFrame || 
      this.hasFrameDurationPassed(timestamp)
    ) {
      this.emitFrame(new AtImageInfo(this.nextFrame.image.clone(), this.scale))
      
      this.shownTimestamp = timestamp
      this.frameDuration = this.nextFrame!.duration
      this.nextFrame!.image.dispose()
      this.nextFrame = null
      
      const completedCycles = Math.floor(this.framesEmitted / this.codec!.frameCount)
      if (
        this.codec.repetitionCount === -1 || 
        completedCycles <= this.codec.repetitionCount
      ) {
        this.decodeNextFrameAndSchedule()
      }

      return
    }

    const delay = this.frameDuration! - (timestamp - this.shownTimestamp)
    // this.timer = Timer(delay * timeDilation, () {
    //   this.scheduleAppFrame()
    // });
  }

  hasFrameDurationPassed (timestamp: number): boolean {
    return timestamp - this.shownTimestamp >= this.frameDuration!
  }

  async decodeNextFrameAndSchedule () {
    this.nextFrame?.image.dispose()
    this.nextFrame = null

    invariant(this.codec, `The "this.codec" cannot be null.`)

    try {
      this.nextFrame = await this.codec.getNextFrame()
    } catch (exception) {
      // 
      return
    }
    if (this.codec.frameCount === 1) {
      if (!this.hasStream) {
        return
      }
      
      this.emitFrame(new AtImageInfo(this.nextFrame.image.clone(), this.scale))
      this.nextFrame!.image.dispose()
      this.nextFrame = null
      return
    }

    this.scheduleAppFrame()
  }

  scheduleAppFrame () {
    if (this.frameCallbackScheduled) {
      return
    }

    this.frameCallbackScheduled = true

    // SchedulerBinding.instance!.scheduleFrameCallback(this.handleAppFrame)
  }

  emitFrame (imageInfo: AtImageInfo) {
    this.setImage(imageInfo)
    this.framesEmitted += 1
  }

  add (stream: AtImageStream) {
    if (!this.hasStream && this.codec !== null && (
      this.image === null || this.codec!.frameCount > 1
    ))

    this.decodeNextFrameAndSchedule()
    super.add(stream)
  }

  /**
   * @description 
   * @param stream 
   */
  remove (stream: AtImageStream) {
    super.remove(stream)
    if (!this.hasStream) {
      // this.timer?.cancel()
      // this.timer = null
    }
  }

  dispose () {
    super.dispose()
    if (this.disposed) {
      // @TODO
    }
  }
}

// => AtImageProviderKey
export abstract class AtImageProviderKey {
  abstract equal (other: AtImageProviderKey): boolean
}

// => AtImageProvider
export abstract class AtImageProvider<T extends AtImageProviderKey = AtImageProviderKey> { 
  abstract key: T

  abstract obtainKeyAsync (configuration: AtImageConfiguration): Promise<T>
  abstract obtainKey (configuration: AtImageConfiguration): T
  abstract load (key: T, decode: ImageDecodeCallback): AtImageStreamCompleter

  /**
   * @description 创建图片流
   * @param {AtImageConfiguration} configuration 
   * @returns {AtImageStream}
   */
  createStream (configuration: AtImageConfiguration): AtImageStream {
    return new AtImageStream()
  }

  /**
   * 
   * @param {AtImageConfiguration} configuration 
   * @return {AtImageStream}
   */
  resolve (configuration: AtImageConfiguration) {
    invariant(configuration !== null, `The configuration argument cannot be null.`)

    const stream = this.createStream(configuration)
    this.resolveStreamForKey(configuration, stream, this.obtainKey(configuration))

    return stream
  }


  /**
   * 
   * @param configuration 
   * @returns 
   */
  resolveAsync (configuration: AtImageConfiguration) {
    invariant(configuration !== null, `The configuration argument cannot be null.`)
    const stream = this.createStream(configuration)

    return this.obtainKeyAsync(configuration).then((key: T) => {
      return this.resolveStreamForKey(configuration, stream, key)
    }).then(() => stream).catch((error: any) => {
      throw error
    })
  }

  /**
   * 
   * @param {AtImageConfiguration} configuration
   * @param {AtImageStream} stream 
   * @param {AtImageProvider} key 
   * @return void
   */
  resolveStreamForKey (
    configuration: AtImageConfiguration, 
    stream: AtImageStream, 
    key: T, 
  ): void  {

    if (stream.completer !== null) {
      invariant(At.cache.image)
      const completer = At.cache.image.putIfAbsent(key, () => stream.completer!)
      invariant(completer === stream.completer, `The "completer" must be equal.`)
    } else {
      // @ts-ignore
      const completer = At.cache.image!.putIfAbsent(key, () => this.load(key, At.instantiateImageCodec))
      if (completer !== null) {
        stream.completer = completer
      }
    }
  }


  /**
   * @description: 获取图片缓存状态
   * @param {AtImageConfiguration} configuration
   * @return {*}
   */  
   obtainCacheStatus (configuration: AtImageConfiguration): AtImageCacheStatus | null {
    invariant(configuration !== null, `The argument configuration cannot be null.`)

    const key = this.obtainKey(configuration)
    invariant(At.cache.image)
    return At.cache.image.statusForKey(key)
  }

  
  /**
   * @description: 获取图片缓存状态
   * @param {AtImageConfiguration} configuration
   * @return {*}
   */  
  obtainCacheStatusAsync (configuration: AtImageConfiguration): Promise<AtImageCacheStatus | null>  {
    invariant(configuration !== null, `The argument configuration cannot be null.`)

    return this.obtainKeyAsync(configuration).then((key: T) => {
      invariant(At.cache.image)
      return At.cache.image.statusForKey(key)
    })
  }

  equal (other: AtImageProvider<T> | null) {
    return (
      other instanceof AtImageProvider && 
      other === this
    )
  }
}


// => AtNetworkImageKey
export class AtNetworkImageKey extends AtImageProviderKey {
  equal (other: AtNetworkImageKey): boolean {
    return (
      other instanceof AtNetworkImageKey
    )
  }
}

export type AtNetworkImageOptions = {
  url: string
  scale?: number,
  headers?: Map<string, string>
}

// => AtNetworkImage
export class AtNetworkImage extends AtImageProvider<AtNetworkImageKey> {
  static create (options: AtNetworkImageOptions) {
    return new AtNetworkImage(
      options.url,
      options.scale,
      options.headers
    )
  }

  public key: AtNetworkImageKey
  public url: string
  public scale: number
  public headers: Map<String, String> | null
  
  /**
   * 构造函数
   * @param {string} url 
   * @param {number} scale 
   * @param {Map<string, string>} headers 
   */
  constructor (
    url: string, 
    scale: number = 1, 
    headers: Map<string, string> = new Map()
  ) {
    super()

    this.url = url
    this.scale = scale
    this.headers = headers
    this.key = new AtNetworkImageKey()
  }

  /**
   * 
   * @param {AtImageConfiguration} configuration 
   * @return {Promise<this>}
   */
  obtainKeyAsync (configuration: AtImageConfiguration): Promise<AtNetworkImage>  {
    return Promise.resolve(this)
  }

  /**
   * 
   * @param {AtImageConfiguration} configuration 
   * @return {this}
   */
   obtainKey (configuration: AtImageConfiguration): AtNetworkImage {
    return this
  }

  /**
   * 
   * @param {AtNetworkImage} key 
   * @param {ImageDecodeCallback} decode 
   * @return {AtImageStreamCompleter}
   */
  load (key: AtNetworkImage, decode: ImageDecodeCallback) {
    const chunks: ImageChunkEvent[] = []
    
    return new AtMultiFrameImageStreamCompleter(this.loadAsync(key as AtNetworkImage, decode, chunks), key.scale)
  }

  /**
   * 
   * @param {AtNetworkImage} key 
   * @param {ImageDecodeCallback} decode 
   * @param {ImageChunkEvent} chunks 
   * @return
   */
  loadAsync (key: AtNetworkImage, decode: ImageDecodeCallback, chunks: ImageChunkEvent[]) {
    invariant(key === this, `The key must be eqaul this.`)
    return At.instantiateImageCodecFromURL(key.url, (event: ImageChunkEvent) => chunks.push(event))
  }

  /**
   * 
   * @param {AtNetworkImage} other 
   * @return {boolean}
   */
  equal (other: AtNetworkImage) {
    return (
      other instanceof AtNetworkImage &&
      other.url === this.url &&
      other.scale === this.scale
    )
  }

  toString () {
    return `AtNetworkImage(url: ${this.url}, scale: ${this.scale})`
  }
}

// => ImageCache
/**
 * @description 图片缓存对象
 */
export abstract class AtBaseImageCached { 
  public completer: AtImageStreamCompleter
  public sizeBytes: number | null

  /**
   * 
   * @param completer 
   * @param sizeBytes 
   */
  constructor (completer: AtImageStreamCompleter, sizeBytes?: number | null) {
    invariant(completer !== null, `The argument "completer" cannot be null.`)
    this.completer = completer
    this.sizeBytes = sizeBytes ?? null
  }

  dispose () {}
}

// => AtCachedImage
class AtCachedImage extends AtBaseImageCached {
  constructor (completer: AtImageStreamCompleter, sizeBytes: number | null) {
    super(completer, sizeBytes)
  }
}

/**
 * @description 正在挂在图片对象
 */
class AtPencildingImage extends AtBaseImageCached {
  public stream: AtImageStream

  /**
   * @param {AtImageStreamCompleter} completer 
   * @param {AtImageStream} stream 
   */
  constructor (completer: AtImageStreamCompleter, stream: AtImageStream) {
    super(completer, 0)
    this.stream = stream
  }

  remove () {
    this.completer.remove(this.stream)
  }
}

class AtLiveImage extends AtBaseImageCached {
  /**
   * 
   * @param {AtImageStreamCompleter} completer 
   * @param {VoidCallback} handleRemove 
   * @param {number | null} sizeBytes 
   */
  constructor (
    completer: AtImageStreamCompleter, 
    handleRemove: VoidCallback, 
    sizeBytes: number | null = null
    ) {
    super(completer, sizeBytes)

    completer.on('lastStreamRemovedCallbacks', () => {
      handleRemove()
      this.dispose()
    })
  }

  dispose () {
    this.completer.off('lastStreamRemovedCallbacks')
    super.dispose()
  }

  toString () {
    return `AtLiveImage()`
  }
}

export class AtImageCacheStorage<K extends AtImageProviderKey, V extends AtBaseImageCached> {
  public storage: Map<K, V> = new Map()

  public get size () {
    return this.storage.size
  }

  keys () {
    return this.storage.keys()
  }

  putIfAbsent (key: K, ifAbsent: () => V) {
    if (!this.containsKey(key)) {
      this.add(key, ifAbsent())
    }
  }

  containsKey (key: K) {
    for (const [k, value] of this.storage) {
      if (key.equal(k)) {
        return true
      }
    }

    return false
  }

  find (key: K): V | null {
    for (const [k, value] of this.storage) {
      if (key.equal(k)) {
        return value
      }
    }
    
    return null
  }
  
  add (key: K, value: V) {
    if (this.containsKey(key)) {
      this.remove(key)
    }

    this.storage.set(key, value)
  }

  remove (key: K): V | null {
    for (const [k, value] of this.storage) {
      if (k.equal(key)) {
        this.storage.delete(k)
        return value
      }
    }

    return null
  }

  clear () {
    for (const [k, image] of this.storage) {
      image?.dispose()
      this.storage.delete(k)
    }
  }
}

export class AtImageCache<T extends AtImageProviderKey = AtImageProviderKey> {
  static create () {
    return new AtImageCache()
  }

  public livingImages: AtImageCacheStorage<T, AtLiveImage> = new AtImageCacheStorage()
  public cachedImages: AtImageCacheStorage<T, AtCachedImage> = new AtImageCacheStorage()
  public pendingImages: AtImageCacheStorage<T, AtPencildingImage> = new AtImageCacheStorage()

  public listenedOnce: boolean = false
  public sizeBytes: number = 0

  public get livingCount () {
    return this.livingImages.size
  } 

  get pendingCount () {
    return this.pendingImages.size
  }

  public get size () {
    return this.cachedImages.size
  }

  /**
   * @description 最大存储空间
   */
  private _maximumSizeBytes: number = At.kImageCacheSize as number
  public get maximumSizeBytes () {
    return this._maximumSizeBytes
  }
  public set maximumSizeBytes (size: number) {
    invariant(size !== null, `The argument "size" cannot be null.`)
    invariant(size >= 0)
    
    if (size !== this.maximumSizeBytes) {
      this._maximumSizeBytes = size
    }

    if (this._maximumSizeBytes) {
      this.clear()
    }
  }
  
  private _maximumSize: number = At.kImageCacheSizeBytes as number
  public get maximumSize () {
    return this._maximumSize
  }
  public set maximumSize (size: number) {
    invariant(size !== null, `The argument "size" cannot be null.`)
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
    this.cachedImages.clear()
    this.pendingImages.clear()
  }

  /**
   * 
   * @param {AtImageProvider} key 
   * @param {boolean} includeLive 
   * @return {boolean}
   */
  evict (key: T, includeLive: boolean = true): boolean {
    invariant(includeLive !== null, `The argument "includeLive" cannot be null.`)
    
    if (includeLive) {
      this.livingImages.remove(key)?.dispose()
    }

    const pending = this.pendingImages.remove(key)
    if (pending !== null) {
      pending.remove()
      return true
    }

    const image = this.cachedImages.remove(key)
    if (image !== null) {
      this.sizeBytes -= image.sizeBytes as number
      image.dispose()
      return true
    }
   
    return false
  }

  /**
   * @description 创建缓存
   * @param {AtImageProvider} key 
   * @param {AtCachedImage} image 
   */
  touch (key: T, image: AtCachedImage) {
    if (
      image.sizeBytes !== null && 
      image.sizeBytes! <= this.maximumSizeBytes && 
      this.maximumSize > 0
    ) {
      this.sizeBytes += image.sizeBytes
      this.cachedImages.add(key, image)
    } else {
      image.dispose()
    }
  }

  /**
   * 
   * @param {AtImageProvider} key 
   * @param {AtImageStreamCompleter} completer 
   * @param {number | null} sizeBytes 
   */
  trackLiveImage (
    key: T, 
    completer: AtImageStreamCompleter, 
    sizeBytes: number | null
  ) {
    this.livingImages.putIfAbsent(key, () => {
      const image = new AtLiveImage(completer, () => this.livingImages.remove(key))
      image.sizeBytes ??= sizeBytes
      return image
    })
  }

  putIfAbsent (key: T, loader: () => AtImageStreamCompleter): AtImageStreamCompleter | null {
    invariant(key !== null, `The argument key cannot be null.`)
    invariant(loader !== null, `The argument loader cannot be null.`)
   
    let pending: AtPencildingImage | null = this.pendingImages.find(key) ?? null
    
    if (pending !== null) {
      return pending.completer
    }
   
    let image: AtCachedImage | null = this.cachedImages.remove(key)
    
    if (image !== null) {
      this.trackLiveImage(key, image.completer, image.sizeBytes)
      this.cachedImages.add(key, image)
      return image.completer
    }

    let live = this.livingImages.find(key)
    if (live !== null) {
      this.touch(key, new AtCachedImage(live.completer, live.sizeBytes))
      return live.completer
    }

    let result: AtImageStreamCompleter

    result = loader() as AtImageStreamCompleter
    this.trackLiveImage(key, result, null)
    
    let listenedOnce = false
    let untrackedPendingImage: AtPencildingImage | null
    
    const stream = new AtImageStream()
    stream.on('image', (info: AtImageInfo | null, sync: boolean) => {
      let sizeBytes: number | null = null

      if (info !== null) {
        sizeBytes = info.sizeBytes
        info.dispose()
      }

      const image = new AtCachedImage(result, sizeBytes)
      this.trackLiveImage(key, result, sizeBytes)

      if (untrackedPendingImage === null) {
        this.touch(key, image)
      } else {
        image.dispose()
      }

      let pending = untrackedPendingImage ?? this.pendingImages.remove(key)
      if (pending !== null) {
        pending?.remove()
      }
      
      listenedOnce = true
    })
    
    if (
      this.maximumSize > 0 && 
      this.maximumSizeBytes > 0
    ) {
      this.pendingImages.add(key, new AtPencildingImage(result, stream))
    } else {
      untrackedPendingImage = new AtPencildingImage(result, stream)
    }
    
    result.add(stream)

    return result
  }

  statusForKey (key: T): AtImageCacheStatus {
    return new AtImageCacheStatus(
      this.pendingImages.containsKey(key),
      this.cachedImages.containsKey(key),
      this.livingImages.containsKey(key),
    )
  }

  containsKey (key: T) {
    return (
      this.pendingImages.containsKey(key)|| 
      this.cachedImages.containsKey(key)
    )
  }
  
  clearLive () {
    for (const [key, image] of this.livingImages.storage) {
      image.dispose()
      this.livingImages.remove(key)
    }
  }

  checkCacheSize () {    
    while (
      this.sizeBytes > this.maximumSizeBytes || 
      this.cachedImages.size > this.maximumSize
    ) {
      const key = Array.from(this.cachedImages.keys())[0]
      const image = this.cachedImages.find(key) as AtCachedImage
      if (image) {
        this.sizeBytes -= image.sizeBytes!
      }
      image.dispose()
      this.cachedImages.remove(key)
    }
    
    invariant(this.sizeBytes >= 0)
    invariant(this.cachedImages.size <= this.maximumSize)
    invariant(this.sizeBytes <= this.maximumSizeBytes)
  }
}

// => AtImageCacheStatus
export class AtImageCacheStatus {
  public live: boolean
  public pending: boolean
  public keepAlive: boolean

  public get tracked () {
    return this.pending || this.keepAlive || this.live
  }

  public get untracked () {
    return !this.pending && !this.keepAlive && !this.live
  } 

  constructor (pending: boolean, keepAlive: boolean, live: boolean,) {
    invariant(!pending || !keepAlive)

    this.pending = pending
    this.keepAlive = keepAlive
    this.live = live
  }

  equal (other: AtImageCacheStatus) {
    return (
      other instanceof AtImageCacheStatus &&
      other.keepAlive === this.keepAlive &&
      other.pending === this.pending &&
      other.live === this.live
    )
  }
  
  toString () {
    return `AtImageCacheStatus(${this.pending}, ${this.keepAlive}, ${this.live})`
  }
}

// // => AtResizeImageKey
export class AtResizeImageKey {
  public key: AtImageProviderKey | null
  public width: number
  public height: number

  constructor (
    key: AtImageProviderKey | null, 
    width: number = 0, 
    height: number = 0
  ) {
    this.key = key
    this.width = width
    this.height = height
  }

  equal (other: AtResizeImageKey) {
    invariant(other.key, `The argument "other.key" cannot be null.`)
    invariant(this.key, `The argument "this.key" cannot be null.`)

    return (
      other instanceof AtResizeImageKey &&
      other.key.equal(this.key) &&
      other.width === this.width &&
      other.height === this.height
    )
  }
}

// => AtResizeImage
export class AtResizeImage extends AtImageProvider {
  static resizeIfNeeded (
    cacheWidth: number | null = null, 
    cacheHeight: number | null = null,  
    provider: AtImageProvider
  ): AtImageProvider {
    if (cacheWidth !== null || cacheHeight !== null) {
      return new AtResizeImage(
        provider, 
        cacheWidth as number, 
        cacheHeight as number
      )
    }

    return provider
  }

  public key: AtResizeImageKey

  public width: number
  public height: number
  public allowUpscaling: boolean 
  public provider: AtImageProvider

  constructor (
    provider: AtImageProvider,
    width: number,
    height: number,
    allowUpscaling: boolean = true
  ) {
    super()

    
    this.width = width
    this.height = height
    this.provider = provider
    this.allowUpscaling = allowUpscaling
    this.key = new AtResizeImageKey(null, width, height)
  }


  load (key: AtResizeImageKey, decode: ImageDecodeCallback): AtImageStreamCompleter {
    const decodeResize = (
      bytes: Uint8Array, 
      cacheWidth: number | null = null, 
      cacheHeight: number | null = null, 
      allowUpscaling: boolean | null = null
    ) => {
      invariant(
        cacheWidth === null && cacheHeight === null && allowUpscaling === null,
        `ResizeImage cannot be composed with another ImageProvider that applies cacheWidth, cacheHeight, or allowUpscaling.`,
      )

      return decode(bytes, this.width, this.height, this.allowUpscaling)
    }

    const completer: AtImageStreamCompleter = this.provider.load(this.key, decodeResize)
    return completer
  }

  obtainKeyAsync (configuration: AtImageConfiguration): Promise<AtResizeImageKey> {
    return Promise.resolve().then(() => {
      return this.provider.obtainKeyAsync(configuration).then(key => {
        this.key.key = key
        return this.key
      })
    })
  }

  obtainKey (configuration: AtImageConfiguration): AtResizeImageKey {    
    this.key.key = this.provider.obtainKey(configuration)
    return this.key
  }

  equal (other: AtResizeImage | null) {

    return (
      other instanceof AtResizeImage &&
      other.key?.equal(this.key) &&
      other.width === this.width &&
      other.height === this.height
    )
  }

  notEqual (other: AtResizeImage | null) {
    return !this.equal(other)
  }
}
