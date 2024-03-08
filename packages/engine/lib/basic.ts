import type { Image } from './image'

export interface FrameInfo {
  duration: number
  image: Image
}

export interface ImageCodec {
  index: number,
  frames: number,
  repetitions: number,

  next: () => Promise<FrameInfo>
  dispose: () => void
}

export interface VideoCodec extends ImageCodec {

}

export enum WebGLMajorKind {
  WebGL1 = 1,
  WebGL2 = 2
}