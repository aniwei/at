import { Equalable } from '@at/basic'

export class DeviceGestureSettings extends Equalable<DeviceGestureSettings> {
  static fromConfirugation () {
    return DeviceGestureSettings.create(1.0)
  }

  /**
   * 
   * @param {number} slop 
   * @returns {DeviceGestureSettings}
   */
  static create (slop: number) {
    return new DeviceGestureSettings(slop)
  }

  // => slop
  public slop: number | null
  public get panSlop () {
    return this.slop !== null ? (this.slop * 2) : null
  }

  constructor (slop: number) {
    super()
    this.slop = slop
  }

  /**
   * 
   * @param {DeviceGestureSettings | null} other 
   * @returns {boolean}
   */
  equal (other: DeviceGestureSettings | null) {
    return (
      other instanceof DeviceGestureSettings &&
      other.slop === this.slop
    )
  }
  
  /**
   * 
   * @param {DeviceGestureSettings | null} other 
   * @returns {boolean}
   */
  notEqual (other: DeviceGestureSettings | null) {
    return !this.equal(other)
  }

  toString () {
    return `DeviceGestureSettings([slop]: ${this.slop})`
  }
}