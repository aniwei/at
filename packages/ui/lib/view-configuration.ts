import { Subscribable } from '@at/basic'
import { Size } from '@at/geometry'
import { Matrix4 } from '@at/math'
import { UnimplementedError } from '@at/utils'
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
export abstract class ViewConfiguration extends Subscribable {
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

  toMatrix (): Matrix4 {
    return Matrix4.diagonal3Values(
      this.devicePixelRatio, 
      this.devicePixelRatio, 
      1
    )
  }

  copyWith (size?: Size, devicePixelRatio?: number): ViewConfiguration {
    throw new UnimplementedError()
  } 

  toJSON () {
    return {
      size: this.size,
      devicePixelRatio: this.devicePixelRatio
    }
  }
  
  equal (other: ViewConfiguration | null) {
    return (
      other instanceof ViewConfiguration &&
      other.width === this.width &&
      other.height === this.height &&
      other.devicePixelRatio === this.devicePixelRatio
    )
  }

  notEqual (other: ViewConfiguration | null) {
    return !this.equal(other)
  }
  
  toString () {
    return `ViewConfiguration(
      [width]: ${this.width}, 
      [height]: ${this.height}, 
      [devicePixelRatio]: ${this.devicePixelRatio}
    )`
  }
}