import { At, AtInstance } from './at'

export class App<T extends string> extends AtInstance<T> {

  constructor (
    baseURI: string, 
    rootDir: string
  ) {
    
    super(
      At.env('BASE_URI', baseURI), 
      At.env('ROOT_DIR', rootDir)
    )
  }
}