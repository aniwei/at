/*
 * @author: aniwei aniwei.studio@gmail.com
 * @date: 2022-10-31 02:00:45
 */
export class Padding {
  public left: number
  public top: number
  public right: number
  public bottom: number

  constructor (
    left: number,
    top: number,
    right: number,
    bottom: number
  ) {
    this.left = left
    this.top = top
    this.right = right
    this.bottom = bottom
  }
}