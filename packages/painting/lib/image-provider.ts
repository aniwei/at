import { invariant } from '@at/utils'
import { Equalable } from '@at/basic'
import { Size } from '@at/geometry'
import { AssetBundle } from '@at/asset'
import { Engine, Skia, AnimatedImage } from '@at/engine'
import { Painting } from './painting'
import { ImageCacheStatus } from './image-cache'
import { 
  ImageChunk, 
  ImageStream, 
  ImageStreamRefBox, 
  MultiFrameImageStreamRefBox 
} from './image-stream'

// 图片解码回调
export type ImageDecodeCallback = (
  uri: string,
) => Promise<AnimatedImage>


//// => ImageConfiguration
export interface ImageConfigurationOptions {
  bundle?: AssetBundle | null,
  devicePixelRatio?: number | null,
  textDirection?: Skia.TextDirection,
  size?: Size | null,
}

// 图片配置
export class ImageConfiguration extends Equalable<ImageConfiguration> {
  static get EMPTY () {
    return new ImageConfiguration()
  }
  /**
   * 创建图片配置
   * @param {options} optons
   * @return {*}
   */
  static create (options: ImageConfigurationOptions) {
    return new ImageConfiguration(
      options?.bundle,
      options?.devicePixelRatio,
      options?.textDirection,
      options?.size
    )
  }

  public size: Size | null
  public bundle: AssetBundle | null
  public devicePixelRatio: number | null
  public textDirection: Skia.TextDirection
  
  /**
   * 构造函数
   * @param {AssetBundle} bundle
   * @param {number} devicePixelRatio
   * @param {TextDirection} textDirection
   * @param {Size} size
   */
  constructor (
    bundle: AssetBundle | null = null,
    devicePixelRatio: number | null = 2.0,
    textDirection: Skia.TextDirection = Engine.skia.TextDirection.LTR,
    size: Size | null = null,
  ) {
    super()
    this.bundle = bundle
    this.devicePixelRatio = devicePixelRatio
    this.textDirection = textDirection
    this.size = size
  }

  /**
   * @param {AssetBundle} bundle 
   * @param {number} devicePixelRatio 
   * @param {Skia.TextDirection} textDirection 
   * @param {Size | null} size 
   * @return {ImageConfiguration} 
   */
  copyWith (
    bundle: AssetBundle | null = null,
    devicePixelRatio: number = 2.0,
    textDirection: Skia.TextDirection = Engine.skia.TextDirection.LTR,
    size: Size | null = null,
  ): ImageConfiguration  {
    return ImageConfiguration.create({
      bundle: bundle ?? this.bundle,
      devicePixelRatio: devicePixelRatio ?? this.devicePixelRatio,
      textDirection: textDirection ?? this.textDirection,
      size: size ?? this.size
    })
  }

  /**
   * @param {ImageConfiguration} other
   * @return {*}
   */  
  equal (other: ImageConfiguration | null) {
    return (
      other instanceof ImageConfiguration &&
      other.bundle === this.bundle &&
      other.devicePixelRatio === this.devicePixelRatio &&
      other.textDirection === this.textDirection &&
      (other.size?.equal(this.size) ?? false)
    )
  }

  notEqual (value: ImageConfiguration | null): boolean {
    return !this.equal(value)
  }
  
  toString () {
    return `ImageConfiguration(
      [bundle]: ${this.bundle}, 
      [devicePixelRatio]: ${this.devicePixelRatio}, 
      [textDirection]: ${this.textDirection}, 
      [size]: ${this.size}
    )`
  }
}

// => ImageProviderKey
export abstract class ImageProviderKey extends Equalable<ImageProviderKey> { }

//// => ImageProvider
// 图片提供
export abstract class ImageProvider<T extends ImageProviderKey = ImageProviderKey> extends Equalable<ImageProvider> { 
  abstract key: T

  abstract obtainKeyAsync (configuration: ImageConfiguration): Promise<T>
  abstract obtainKey (configuration: ImageConfiguration): T
  abstract load (key: T, decode: ImageDecodeCallback): ImageStreamRefBox

  /**
   * 创建图片流
   * @param {ImageConfiguration} configuration 
   * @returns {ImageStream}
   */
  createStream (configuration: ImageConfiguration): ImageStream {
    return ImageStream.create()
  }

  /**
   * 
   * @param {ImageConfiguration} configuration 
   * @return {ImageStream}
   */
  resolve (configuration: ImageConfiguration) {
    const stream = this.createStream(configuration)
    this.resolveStreamForKey(configuration, stream, this.obtainKey(configuration))

    return stream
  }


  /**
   * 
   * @param {ImageConfiguration} configuration 
   * @returns 
   */
  resolveAsync (configuration: ImageConfiguration) {
    const stream = this.createStream(configuration)

    return this.obtainKeyAsync(configuration).then((key: T) => {
      return this.resolveStreamForKey(configuration, stream, key)
    }).then(() => stream).catch((error: any) => {
      throw error
    })
  }

  /**
   * 
   * @param {ImageConfiguration} configuration
   * @param {ImageStream} stream 
   * @param {ImageProvider} key 
   * @return void
   */
  resolveStreamForKey (
    configuration: ImageConfiguration, 
    stream: ImageStream, 
    key: T, 
  ): void  {
    if (stream.box !== null) {
      Painting.cached.images.putIfAbsent(key, () => stream.box as ImageStreamRefBox)
    } else {
      const box = Painting.cached.images.putIfAbsent(key, () => this.load(key, Engine.instantiateImageCodec))
      if (box !== null) {
        stream.box = box
      }
    }
  }


  /**
   * 获取图片缓存状态
   * @param {ImageConfiguration} configuration
   * @return {*}
   */  
   obtainCacheStatus (configuration: ImageConfiguration): ImageCacheStatus | null {
    invariant(configuration !== null, `The argument configuration cannot be null.`)

    const key = this.obtainKey(configuration)
    return Painting.cached.images.statusForKey(key)
  }

  
  /**
   * 获取图片缓存状态
   * @param {ImageConfiguration} configuration
   * @return {*}
   */  
  obtainCacheStatusAsync (configuration: ImageConfiguration): Promise<ImageCacheStatus | null>  {
    invariant(configuration !== null, `The argument configuration cannot be null.`)

    return this.obtainKeyAsync(configuration).then((key: T) => {
      return Painting.cached.images.statusForKey(key)
    })
  }

  equal (other: ImageProvider<T> | null) {
    return (
      other instanceof ImageProvider && 
      other === this
    )
  }
}


// => NetworkImageKey
export class NetworkImageKey extends ImageProviderKey {
  equal (other: NetworkImageKey | null): boolean {
    return (
      other instanceof NetworkImageKey
    )
  }

  notEqual (other: NetworkImageKey | null): boolean {
    return this.equal(other)
  }
}


//// => NetworkImage
export type NetworkImageOptions = {
  url: string
  scale?: number,
  headers?: Map<string, string>
}

export class NetworkImage extends ImageProvider<NetworkImageKey> {
  static create (options: NetworkImageOptions) {
    return new NetworkImage(
      options.url,
      options.scale,
      options.headers
    )
  }

  public key: NetworkImageKey
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
    this.key = new NetworkImageKey()
  }

  /**
   * 
   * @param {ImageConfiguration} configuration 
   * @return {Promise<this>}
   */
  obtainKeyAsync (configuration: ImageConfiguration): Promise<NetworkImage>  {
    return Promise.resolve(this)
  }

  /**
   * 
   * @param {ImageConfiguration} configuration 
   * @return {this}
   */
   obtainKey (configuration: ImageConfiguration): NetworkImage {
    return this
  }

  /**
   * 
   * @param {NetworkImage} key 
   * @param {ImageDecodeCallback} decode 
   * @return {ImageStreamRefBox}
   */
  load (key: NetworkImage, decode: ImageDecodeCallback) {
    const chunks: ImageChunk[] = []
    
    return MultiFrameImageStreamRefBox.create(this.loadAsync(key as NetworkImage, decode, chunks), key.scale)
  }

  /**
   * 
   * @param {NetworkImage} key 
   * @param {ImageDecodeCallback} decode 
   * @param {ImageChunkEvent} chunks 
   * @return
   */
  loadAsync (key: NetworkImage, decode: ImageDecodeCallback, chunks: ImageChunk[]) {
    return Engine.instantiateImageCodec(key.url)
  }

  /**
   * 
   * @param {NetworkImage} other 
   * @return {boolean}
   */
  equal (other: NetworkImage | null) {
    return (
      other instanceof NetworkImage &&
      other.url === this.url &&
      other.scale === this.scale
    )
  }

  notEqual(other: NetworkImage | null): boolean {
    return !this.equal(other)
  }

  toString () {
    return `NetworkImage(
      [url]: ${this.url}, 
      [scale]: ${this.scale}
    )`
  }
}

//// => ResizeImageKey
export class ResizeImageKey extends Equalable<ResizeImageKey> {
  public key: ImageProviderKey | null
  public width: number
  public height: number

  constructor (
    key: ImageProviderKey | null, 
    width: number = 0, 
    height: number = 0
  ) {
    super()
    this.key = key
    this.width = width
    this.height = height
  }

  equal (other: ResizeImageKey | null) {
    return (
      other instanceof ResizeImageKey &&
      !!other.key?.equal(this.key) &&
      other.width === this.width &&
      other.height === this.height
    )
  }

  notEqual (other: ResizeImageKey | null): boolean {
    return !this.equal(other)
  }
}

// => AtResizeImage
export class ResizeImage extends ImageProvider {
  static resizeIfNeeded (
    cacheWidth: number | null = null, 
    cacheHeight: number | null = null,  
    provider: ImageProvider
  ): ImageProvider {
    if (cacheWidth !== null || cacheHeight !== null) {
      return new ResizeImage(
        provider, 
        cacheWidth as number, 
        cacheHeight as number
      )
    }

    return provider
  }

  public key: ResizeImageKey

  public width: number
  public height: number
  public allowUpscaling: boolean 
  public provider: ImageProvider

  constructor (
    provider: ImageProvider,
    width: number,
    height: number,
    allowUpscaling: boolean = true
  ) {
    super()

    this.width = width
    this.height = height
    this.provider = provider
    this.allowUpscaling = allowUpscaling
    this.key = new ResizeImageKey(null, width, height)
  }


  load (
    key: ResizeImageKey, 
    decode: ImageDecodeCallback
  ): ImageStreamRefBox {
    const resize = (
      bytes: string
    ) => {
      return decode(bytes)
    }

    const completer: ImageStreamRefBox = this.provider.load(this.key, resize)
    return completer
  }

  obtainKeyAsync (configuration: ImageConfiguration): Promise<ResizeImageKey> {
    return Promise.resolve().then(() => {
      return this.provider.obtainKeyAsync(configuration).then(key => {
        this.key.key = key
        return this.key
      })
    })
  }

  obtainKey (configuration: ImageConfiguration): ResizeImageKey {    
    this.key.key = this.provider.obtainKey(configuration)
    return this.key
  }

  equal (other: ResizeImage | null) {

    return (
      other instanceof ResizeImage &&
      !!other.key?.equal(this.key) &&
      other.width === this.width &&
      other.height === this.height
    )
  }

  notEqual (other: ResizeImage | null) {
    return !this.equal(other)
  }
}
