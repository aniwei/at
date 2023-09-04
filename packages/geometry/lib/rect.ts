// @ts-nocheck
import invariant from 'ts-invariant'
import { Offset } from './offset'

export class Rect extends Array<number> {
    static ZERO = new Rect(0, 0, 0, 0)
    
    static get LARGEST () {
      return 1
    } 
  
    /**
     * 
     * @param left 
     * @param top 
     * @param right 
     * @param bottom 
     * @returns 
     */
    static create (left: number, top: number, right: number, bottom: number) {
      return Rect.fromLTRB(left, top, right, bottom)
    }
  
    /**
     * 
     * @param left 
     * @param top 
     * @param right 
     * @param bottom 
     * @returns 
     */
    static fromLTRB (left: number, top: number, right: number, bottom: number) {
      return new Rect(left, top, right, bottom)
    }
  
    /**
     * 
     * @param left 
     * @param top 
     * @param width 
     * @param height 
     * @returns 
     */
    static fromLTWH (left: number, top: number, width: number, height: number) {
      return new Rect(left, top, left + width, top + height)
    }
  
    /**
     * 
     * @param center 
     * @param radius 
     * @returns 
     */
    static fromCircle (center: Offset, radius: number) {
      return Rect.fromCenter(
        center, 
        radius * 2, 
        radius * 2
      )
    }
  
    static fromCenter (
      center: Offset,
      width: number,
      height: number
    ) {
      return new Rect(
        center.dx - width / 2, 
        center.dy - height / 2,
        center.dx + width / 2,
        center.dy + height / 2
      )
    }
  
    static fromPonumbers (offsetA: Offset, offsetB: Offset) {
      return new Rect(
        Math.min(offsetA.dx, offsetB.dx),
        Math.min(offsetA.dy, offsetB.dy),
        Math.max(offsetA.dx, offsetB.dx),
        Math.max(offsetA.dy, offsetB.dy)
      )
    }
  
    static lerp (a: Rect | null, b: Rect | null, t: number): Rect | null {
      invariant(t !== null)
      if (b === null) {
        if (a === null) {
          return null
        } else {
          const k = 1.0 - t
          return Rect.fromLTRB(a.left * k, a.top * k, a.right * k, a.bottom * k)
        }
      } else {
        if (a === null) {
          return Rect.fromLTRB(b.left * t, b.top * t, b.right * t, b.bottom * t)
        } else {
          return Rect.fromLTRB(
            lerp(a.left, b.left, t),
            lerp(a.top, b.top, t),
            lerp(a.right, b.right, t),
            lerp(a.bottom, b.bottom, t),
          )
        }
      }
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
  
    public get width (): number {
      return this.right - this.left
    }
  
    public get height (): number {
      return this.bottom - this.top
    }
  
    public get size (): Size {
      return new Size(this.width, this.height)
    }
  
    public get isInfinite () {
      return (
        this.left > Infinity ||
        this.top > Infinity ||
        this.right > Infinity ||
        this.bottom > Infinity
      )
    }
  
    public get isFinite () {
      return (
        Number.isFinite(this.left) &&
        Number.isFinite(this.top) &&
        Number.isFinite(this.right) &&
        Number.isFinite(this.bottom) 
      )
    }
  
    public get isNaN () {
      return (
        Number.isNaN(this.left) ||
        Number.isNaN(this.top) ||
        Number.isNaN(this.right) || 
        Number.isNaN(this.bottom)
      )
    }
  
    public get isEmpty () {
      return (
        this.left >= this.right ||
        this.top >= this.bottom
      )
    }
  
    public get shortestSide () {
      return Math.min(
        Math.abs(this.width), 
        Math.abs(this.height)
      )
    }
  
    public get longestSide () {
      return Math.min(
        Math.abs(this.width), 
        Math.abs(this.height)
      )
    }
  
    public get topLeft (): Offset {
      return new Offset(this.left, this.top)
    }
  
    public get topCenter (): Offset {
      return new Offset(
        this.left + this.width / 2, 
        this.top
      )
    }
  
    public get topRight (): Offset {
      return new Offset(this.right, this.top)
    }
  
    public get centerLeft (): Offset {
      return new Offset(
        this.left,
        this.top + this.height / 2
      )
    }
  
    public get center (): Offset {
      return new Offset(
        this.left + this.width / 2,
        this.top + this.height / 2
      )
    }
  
    public get centerRight (): Offset {
      return new Offset(
        this.right,
        this.top + this.height / 2
      )
    }
  
    public get bottomLeft (): Offset {
      return new Offset(
        this.left,
        this.bottom,
      )
    }
  
    public get bottomCenter (): Offset {
      return new Offset(
        this.left + this.width / 2,
        this.bottom,
      )
    }
  
    public get bottomRight (): Offset {
      return new Offset(
        this.left,
        this.bottom,
      )
    }
  
    constructor (
      left: number, 
      top: number, 
      right: number, 
      bottom: number
    ) {
      super(left, top, right, bottom)
    }
  
    shift (): number
    shift (offset: Offset): Rect
    shift (offset?: Offset): number | Rect | undefined {
      if (offset !== undefined) {
        return Rect.fromLTRB(
          this.left + offset.dx, 
          this.top + offset.dy,
          this.right + offset.dx,
          this.bottom + offset.dy
        )
      }
    }
  
    translate (translateX: number, translateY: number) {
      return Rect.fromLTRB(
        this.left + translateX, 
        this.top + translateY,
        this.right + translateX, 
        this.bottom + translateY
      )
    }
  
    inflate (delta: number) {
      return Rect.fromLTRB(
        this.left - delta, 
        this.top - delta, 
        this.right + delta, 
        this.bottom + delta
      )
    }
  
    deflate (delta: number) {
      return this.inflate(-delta)
    }
  
    intersect (rect: Rect) {
      return Rect.fromLTRB(
        Math.max(this.left, rect.left),
        Math.max(this.top, rect.top),
        Math.min(this.right, rect.right),
        Math.min(this.bottom, rect.bottom),
      );
    }
  
    expandToInclude (rect: Rect): Rect {
      return Rect.fromLTRB(
        Math.min(this.left, rect.left),
        Math.min(this.top, rect.top),
        Math.max(this.right, rect.right),
        Math.max(this.bottom, rect.bottom)
      )
    }
  
    overlaps (rect: Rect): boolean {
      if (
        this.right <= rect.left ||
        rect.right <= this.left
      ) {
        return false
      }
  
      if (
        this.bottom <= rect.top ||
        rect.bottom <= this.top
      ) {
        return false
      }
  
      return true
    }
  
    contains (offset: Offset): boolean {
      return (
        offset.dx >= this.left &&
        offset.dx < this.right &&
        offset.dy >= this.top &&
        offset.dy < this.bottom
      )
    }
  
    equal (rect: Rect | null): boolean {
      return (
        rect instanceof Rect &&
        this.left === rect.left &&
        this.top === rect.top &&
        this.right === rect.right &&
        this.bottom === rect.bottom
      )
    }
  
    notEqual (rect: Rect | null) {
      return this.equal(rect)
    }
  
    toString () {
      return `Rect.fromLTRB(${this.left}, ${this.top}, ${this.right}, ${this.bottom})`
    }  
  }