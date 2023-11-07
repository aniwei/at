import type { Image } from './image'

export interface FrameInfo {
  duration: number
  image: Image
}

export enum WebGLMajorKind {
  WebGL1 = 1,
  WebGL2 = 2
}