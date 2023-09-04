import invariant from 'ts-invariant'
import { Rect } from './rect'
import { Radius } from './radius'
import { Offset } from './offset'

export class RRect extends Array<number> {
    /**
     * @description: 
     * @return {RRect}
     */  
    static zero = RRect.raw()
  
    /**
     * @description: 
     * @return {RRect}
     */  
    static fromLTRBXY (
      left: number, 
      top: number, 
      right: number, 
      bottom: number,
      radiusX: number,
      radiusY: number
    ) {
      return new RRect(
        left,
        top,
        right,
        bottom,
        radiusX,
        radiusY,
        radiusX,
        radiusY,
        radiusX,
        radiusY,
        radiusX,
        radiusY,
        radiusX === radiusY
      )
    }
  
    /**
     * @description: 
     * @return {RRect}
     */  
    static fromLTRBR (
      left: number, 
      top: number, 
      right: number, 
      bottom: number,
      radius: Radius
    ) {
      return new RRect(
        top,
        left,
        right,
        bottom,
        radius.x,
        radius.y,
        radius.x,
        radius.y,
        radius.x,
        radius.y,
        radius.x,
        radius.y,
        radius.x === radius.y
      )
    }
  
  
    /**
     * @description: 
     * @param {Rect} rect
     * @param {number} radiusX
     * @param {number} radiusY
     * @return {*}
     */
    static fromRectXY (
      rect: Rect,
      radiusX: number,
      radiusY: number
    ) {
      return RRect.raw(
        rect.top,
        rect.left,
        rect.right,
        rect.bottom,
        radiusX,
        radiusY,
        radiusX,
        radiusY,
        radiusX,
        radiusY,
        radiusX,
        radiusY,
        radiusX === radiusY
      )
    }
  
    /**
     * @description: 
     * @param {Rect} rect
     * @param {Radius} radius
     * @return {*}
     */
    static fromRectAndRadius (
      rect: Rect,
      radius: Radius
    ) {
      return RRect.raw(
        rect.left,
        rect.top,
        rect.right,
        rect.bottom,
        radius.x,
        radius.y,
        radius.x,
        radius.y,
        radius.x,
        radius.y,
        radius.x,
        radius.y,
        radius.x === radius.y
      )
    }
  
    /**
     * @description: 
     * @param {Rect} rect
     * @param {Radius} topLeft
     * @param {Radius} topRight
     * @param {Radius} bottomRight
     * @param {Radius} bottomLeft
     * @return {*}
     */
    static fromRectAndCorners (
      rect: Rect,
      topLeft: Radius = Radius.zero,
      topRight: Radius = Radius.zero,
      bottomRight: Radius = Radius.zero,
      bottomLeft: Radius = Radius.zero,
    ) {
      return RRect.raw(
        rect.left,
        rect.top,
        rect.right,
        rect.bottom,
        topLeft.x,
        topLeft.y,
        topRight.x,
        topRight.y,
        bottomRight.x,
        bottomRight.y,
        bottomLeft.x,
        bottomLeft.y,
        (
          topLeft.x === topLeft.y &&
          topLeft.x === topRight.x &&
          topLeft.x === topRight.y &&
          topLeft.x === bottomLeft.x &&
          topLeft.x === bottomLeft.y &&
          topLeft.x === bottomRight.x &&
          topLeft.x === bottomRight.y
        )
      )
    }
  
    /**
     * @description: 
     * @param {number} left
     * @param {number} top
     * @param {number} right
     * @param {number} bottom
     * @param {Radius} topLeft
     * @param {Radius} topRight
     * @param {Radius} bottomRight
     * @param {Radius} bottomLeft
     * @return {*}
     */
    static fromLTRBAndCorners (
      left: number,
      top: number,
      right: number,
      bottom: number,
      topLeft: Radius = Radius.zero,
      topRight: Radius = Radius.zero,
      bottomRight: Radius = Radius.zero,
      bottomLeft: Radius = Radius.zero,
    ) {
      return RRect.raw(
        top,
        left,
        right,
        bottom,
        topLeft.x,
        topLeft.y,
        topRight.x,
        topRight.y,
        bottomLeft.x,
        bottomLeft.y,
        bottomRight.x,
        bottomRight.y,
        (
          topLeft.x == topLeft.y &&
          topLeft.x == topRight.x &&
          topLeft.x == topRight.y &&
          topLeft.x == bottomLeft.x &&
          topLeft.x == bottomLeft.y &&
          topLeft.x == bottomRight.x &&
          topLeft.x == bottomRight.y
        )
      )
    }
  
    /**
     * @description: 
     * @param {number} left
     * @param {number} top
     * @param {number} right
     * @param {number} bottom
     * @param {number} tlRadiusX
     * @param {number} tlRadiusY
     * @param {number} trRadiusX
     * @param {number} trRadiusY
     * @param {number} brRadiusX
     * @param {number} brRadiusY
     * @param {number} blRadiusX
     * @param {number} blRadiusY
     * @param {boolean} uniformRadii
     * @return {*}
     */
    static raw(
      left: number = 0.0,
      top: number = 0.0,
      right: number = 0.0,
      bottom: number = 0.0,
      tlRadiusX: number = 0.0,
      tlRadiusY: number = 0.0,
      trRadiusX: number = 0.0,
      trRadiusY: number = 0.0,
      blRadiusX: number = 0.0,
      blRadiusY: number = 0.0,
      brRadiusX: number = 0.0,
      brRadiusY: number = 0.0,
      uniformRadii: boolean = false,
    ) {
      invariant(left !== null, `The left argument cannot be null.`)
      invariant(top !== null, `The top argument cannot be null.`)
      invariant(right !== null, `The right argument cannot be null.`)
      invariant(bottom !== null, `The bottom argument cannot be null.`)
      invariant(tlRadiusX !== null, `The tlRadiusX argument cannot be null.`)
      invariant(tlRadiusY !== null, `The tlRadiusY argument cannot be null.`)
      invariant(trRadiusX !== null, `The trRadiusX argument cannot be null.`)
      invariant(trRadiusY !== null, `The trRadiusY argument cannot be null.`)
      invariant(brRadiusX !== null, `The brRadiusX argument cannot be null.`)
      invariant(brRadiusY !== null, `The brRadiusY argument cannot be null.`)
      invariant(blRadiusX !== null, `The blRadiusX argument cannot be null.`)
      invariant(blRadiusY !== null, `The blRadiusY argument cannot be null.`)
  
      return new RRect(
        left,
        top,
        right,
        bottom,
        tlRadiusX,
        tlRadiusY,
        trRadiusX,
        trRadiusY,
        blRadiusX,
        blRadiusY,
        brRadiusX,
        brRadiusY,
        uniformRadii,
      )
    }
  
    public get left () {
      return this[0]
    }
    public set left (value: number) {
      this[0] = value
    }
    public get top () {
      return this[1]
    }
    public set top (value: number) {
      this[1] = value
    }
    public get right () {
      return this[2]
    }
    public set right (value: number) {
      this[2] = value
    }
    public get bottom () {
      return this[3]
    }
    public set bottom (value: number) {
      this[3] = value
    }
    public get tlRadiusX () {
      return this[4]
    }
    public set tlRadiusX (value: number) {
      this[4] = value
    }
    public get tlRadiusY () {
      return this[5]
    }
    public set tlRadiusY (value: number) {
      this[5] = value
    }
    public get trRadiusX () {
      return this[6]
    }
    public set trRadiusX (value: number) {
      this[6] = value
    }
    public get trRadiusY () {
      return this[7]
    }
    public set trRadiusY (value: number) {
      this[7] = value
    }
    public get brRadiusX () {
      return this[8]
    }
    public set brRadiusX (value: number) {
      this[8] = value
    }
    public get brRadiusY () {
      return this[9]
    }
    public set brRadiusY (value: number) {
      this[9] = value
    }
    public get blRadiusX () {
      return this[10]
    }
    public set blRadiusX (value: number) {
      this[10] = value
    }
    public get blRadiusY () {
      return this[11]
    }
    public set blRadiusY (value: number) {
      this[11] = value
    }
    
    public get tlRadius () {
      return Radius.elliptical(this.tlRadiusX, this.tlRadiusY)
    }
  
    public get trRadius () {
      return Radius.elliptical(this.trRadiusX, this.trRadiusY)
    }
  
    public get blRadius () {
      return Radius.elliptical(this.blRadiusX, this.blRadiusY)
    }
  
    public get brRadius () {
      return Radius.elliptical(this.brRadiusX, this.brRadiusY)
    }
  
    public get width () {
      return this.right - this.left
    }
  
    public get height () {
      return this.bottom - this.top
    }
  
    public get outerRect () {
      return Rect.fromLTRB(this.left, this.top, this.right, this.bottom)
    }
  
    public get safeInnerRect () {
      const kInsetFactor = 0.29289321881 // 1-cos(pi/4)
  
      const leftRadius = Math.max(this.blRadiusX, this.tlRadiusX)
      const topRadius = Math.max(this.tlRadiusY, this.trRadiusY)
      const rightRadius = Math.max(this.trRadiusX, this.brRadiusX)
      const bottomRadius = Math.max(this.brRadiusY, this.blRadiusY)
  
      return Rect.fromLTRB(
        this.left + leftRadius * kInsetFactor,
        this.top + topRadius * kInsetFactor,
        this.right - rightRadius * kInsetFactor,
        this.bottom - bottomRadius * kInsetFactor
      )
    }
  
    public uniformRadii: boolean = false
    public webOnlyUniformRadii: boolean
  
    /**
     * @description: 
     * @param {number} left
     * @param {number} top
     * @param {number} right
     * @param {number} bottom
     * @param {number} tlRadiusX
     * @param {number} tlRadiusY
     * @param {number} trRadiusX
     * @param {number} trRadiusY
     * @param {number} brRadiusX
     * @param {number} brRadiusY
     * @param {number} blRadiusX
     * @param {number} blRadiusY
     * @param {boolean} uniformRadii
     * @return {*}
     */
    constructor (
      left: number = 0,
      top: number = 0,
      right: number = 0,
      bottom: number = 0,
      tlRadiusX: number = 0,
      tlRadiusY: number = 0,
      trRadiusX: number = 0,
      trRadiusY: number = 0,
      brRadiusX: number = 0,
      brRadiusY: number = 0,
      blRadiusX: number = 0,
      blRadiusY: number = 0,
      uniformRadii: boolean = false
    ) {
      super(
        left,
        top,
        right,
        bottom,
        tlRadiusX,
        tlRadiusY,
        trRadiusX,
        trRadiusY,
        brRadiusX,
        brRadiusY,
        blRadiusX,
        blRadiusY
      )
  
      this.uniformRadii = uniformRadii
      this.webOnlyUniformRadii = uniformRadii
    }
  
    /**
     * @description: 
     * @param {number} min
     * @param {number} radiusA
     * @param {number} radiusB
     * @param {number} limit
     * @return {*}
     */
    getMin (min: number, radiusA: number, radiusB: number, limit: number) {
      const sum = radiusA + radiusB
      if (sum > limit && sum !== 0) {
        return Math.min(min, limit / sum)
      }
  
      return min
    } 
  
    /**
     * @description: 
     * @return {*}
     */  
    scaleRadii () {
      let scale = 1
      const absWidth = Math.abs(this.width)
      const absHeight = Math.abs(this.height)
  
      scale = this.getMin(scale, this.blRadiusY, this.tlRadiusY, absHeight)
      scale = this.getMin(scale, this.tlRadiusX, this.trRadiusX, absWidth)
      scale = this.getMin(scale, this.trRadiusY, this.brRadiusY, absHeight)
      scale = this.getMin(scale, this.brRadiusX, this.blRadiusX, absWidth)
  
      if (scale < 1) {
        return RRect.raw(
          this.top,
          this.left,
          this.right,
          this.bottom,
          this.tlRadiusX * scale,
          this.tlRadiusX * scale,
          this.tlRadiusX * scale,
          this.tlRadiusX * scale,
          this.tlRadiusX * scale,
          this.tlRadiusX * scale,
          this.tlRadiusX * scale,
          this.tlRadiusX * scale
        )
      }
  
      return RRect.raw(
        this.top,
        this.left,
        this.right,
        this.bottom,
        this.tlRadiusX,
        this.tlRadiusX,
        this.tlRadiusX,
        this.tlRadiusX,
        this.tlRadiusX,
        this.tlRadiusX,
        this.tlRadiusX,
        this.tlRadiusX
      )
    }
  
    /**
     * @description: 
     * @param {Offset} point
     * @return {*}
     */  
    contains (point: Offset) {
      if (
        point.dx < this.left ||
        point.dx >= this.right ||
        point.dy < this.top ||
        point.dy >= this.bottom
      ) {
        return false
      }
  
       const scaled = this.scaleRadii()
  
      let x: number
      let y: number
      let radiusX: number
      let radiusY: number
      
      if (
        point.dx < this.left + scaled.tlRadiusX &&
        point.dy < this.top + scaled.tlRadiusY
      ) {
        x = point.dx - this.left - scaled.tlRadiusX
        y = point.dy - this.top - scaled.tlRadiusY
        radiusX = scaled.tlRadiusX
        radiusY = scaled.tlRadiusY
      } else if (
        point.dx > this.right - scaled.trRadiusX &&
        point.dy < this.top + scaled.trRadiusY
      ) {
        x = point.dx - this.right + scaled.trRadiusX
        y = point.dy - this.top - scaled.trRadiusY
        radiusX = scaled.trRadiusX
        radiusY = scaled.trRadiusY
      } else if (
        point.dx > this.right - scaled.brRadiusX &&
        point.dy > this.bottom - scaled.brRadiusY
      ) {
        x = point.dx - this.right + scaled.brRadiusX
        y = point.dy - this.bottom + scaled.brRadiusY
        radiusX = scaled.brRadiusX
        radiusY = scaled.brRadiusY
      } else if (
        point.dx < this.left + scaled.blRadiusX &&
        point.dy > this.bottom - scaled.blRadiusY
      ) {
        x = point.dx - this.left - scaled.blRadiusX
        y = point.dy - this.bottom + scaled.blRadiusY
        radiusX = scaled.blRadiusX
        radiusY = scaled.blRadiusY
      } else {
        return true
      }
  
      x = x / radiusX
      y = y / radiusY
      
      if (x * x + y * y > 1.0) {
        return false
      }
  
      return true
    }
  
    /**
     * @description: 
     * @param {Offset} offset
     * @return {*}
     */  
    
    shift (): number
    shift (offset: Offset): RRect
    shift (offset?: Offset): number | RRect | undefined  {
      invariant(offset, `The argument "offset" cannot be null.`)
      return RRect.raw(
        this.left + offset.dx,
        this.top + offset.dy,
        this.right + offset.dx,
        this.bottom + offset.dy,
        this.tlRadiusX,
        this.tlRadiusY,
        this.trRadiusX,
        this.trRadiusY,
        this.blRadiusX,
        this.blRadiusY,
        this.brRadiusX,
        this.brRadiusY,
      )
    }
  
    /**
     * @description: 
     * @param {number} delta
     * @return {*}
     */  
    inflate (delta: number) {
      return RRect.raw(
        this.left - delta,
        this.top - delta,
        this.right + delta,
        this.bottom + delta,
        this.tlRadiusX + delta,
        this.tlRadiusY + delta,
        this.trRadiusX + delta,
        this.trRadiusY + delta,
        this.brRadiusX + delta,
        this.brRadiusY + delta,
        this.blRadiusX + delta,
        this.blRadiusY + delta,
      )
    }
  
    /**
     * @description: 
     * @param {number} delta
     * @return {*}
     */  
    deflate (delta: number) {
      return this.inflate(-delta)
    }
  
    /**
     * @description: 
     * @param {RRect} other
     * @return {*}
     */  
    equal (other: RRect | null) {
      return (
        other instanceof RRect &&
        other.left === this.left &&
        other.top === this.top &&
        other.right === this.right &&
        other.bottom === this.bottom &&
        other.tlRadiusX === this.tlRadiusX &&
        other.tlRadiusY === this.tlRadiusY &&
        other.trRadiusX === this.trRadiusX &&
        other.trRadiusY === this.trRadiusY &&
        other.blRadiusX === this.blRadiusX &&
        other.blRadiusY === this.blRadiusY &&
        other.brRadiusX === this.brRadiusX &&
        other.brRadiusY === this.brRadiusY
      )
    }
  
    notEqual (other: RRect | null) {
      return !this.equal(other)
    }
  }