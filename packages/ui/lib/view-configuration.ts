import { Subscribable } from '@at/basic'
import { Size } from '@at/geometry'
import { Matrix4 } from '@at/math'
//// => ViewConfiguration


// 视图配置
export interface ViewConfigurationOptions {
  width: number,
  height: number,
  devicePixelRatio: number
}

export interface ViewConfigurationFactory<T> {
  new (
    width: number,
    height: number,
    devicePixelRatio: number,
  ): T
  new (...rests: unknown[]): T
  create (options: ViewConfigurationOptions): T
}
export class ViewConfiguration extends Subscribable {
  static create <T extends ViewConfiguration> (...rests: unknown[]): ViewConfiguration
  static create <T extends ViewConfiguration> (options: ViewConfigurationOptions): ViewConfiguration {
    const ViewConfigurationFactory = this as unknown as ViewConfigurationFactory<T>
    return new ViewConfigurationFactory(
      options.width,
      options.height,
      options.devicePixelRatio
    )
  }

  public width: number
  public height: number
  public devicePixelRatio: number

  /**
   * 构造函数
   * @param {number} devicePixelRatio 
   */
  constructor (...rests: unknown[])
  constructor (
    width: number,
    height: number,
    devicePixelRatio: number,
  ) {
    super()

    this.width = width
    this.height = height
    this.devicePixelRatio = devicePixelRatio
  }

  /**
   * 转成矩阵
   * @returns {Matrix4}
   */
  toMatrix (): Matrix4 {
    return Matrix4.diagonal3Values(
      this.devicePixelRatio, 
      this.devicePixelRatio, 
      1
    )
  }

  /**
   * 复制配置
   * @param {Size | null} size 
   * @param {number | null} devicePixelRatio 
   * @returns {ViewConfiguration}
   */
  copyWith (size: Size | null = null, devicePixelRatio: number = this.devicePixelRatio): ViewConfiguration {
    return ViewConfiguration.create({
      width: size?.width ?? this.width,
      height: size?.height ?? this.height,
      devicePixelRatio
    })
  } 

  /**
   * 序列号配置
   * @returns 
   */
  toJSON () {
    return {
      size: this.size,
      devicePixelRatio: this.devicePixelRatio
    }
  }
  
  /**
   * 配置是否一样
   * @param {ViewConfiguration | null} other 
   * @returns {boolean}
   */
  equal (other: ViewConfiguration | null) {
    return (
      other instanceof ViewConfiguration &&
      other.width === this.width &&
      other.height === this.height &&
      other.devicePixelRatio === this.devicePixelRatio
    )
  }

  /**
   * 配置是否一样
   * @param {ViewConfiguration | null} other 
   * @returns {boolean}
   */
  notEqual (other: ViewConfiguration | null) {
    return !this.equal(other)
  }
  
  /**
   * 
   * @returns {string}
   */
  toString () {
    return `ViewConfiguration(
      [width]: ${this.width}, 
      [height]: ${this.height}, 
      [devicePixelRatio]: ${this.devicePixelRatio}
    )`
  }
}