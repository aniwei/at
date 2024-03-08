import { fetch, EventEmitter } from '@at/basic'
import { invariant } from '@at/utils'
import { documentRead } from './read'
import { Element } from './element'

//// => DocumentLoader
// 文档还在器
export class DocumentLoader extends EventEmitter<'progress' | 'end' | 'error'> {
  static create (uri: string) {
    return new DocumentLoader(uri)
  }

  public uri: string

  constructor (uri: string) {
    super()
    this.uri = uri
  }

  request () {
    return fetch(this.uri).then(async response => {
      invariant(response.headers)
      invariant(response.body)

      const reader = response.body.getReader()
      const contentLength = Number(response.headers.get('Content-Length')) as unknown as number
      
      let receivedLength = 0
      let chunks = []

      while (true) {
        const { done, value } = await reader.read().then(result => {
          if (!result.done) {
            const progress = receivedLength / contentLength
            if (progress > 0) {
              this.emit('progress', progress)
            }
          }

          return result
        })

        if (done) {
          break
        }

        chunks.push(value)
        receivedLength += value.length
      }

      const sab = new SharedArrayBuffer(contentLength)
      const data = new Uint8Array(sab)
      let position = 0

      for (const chunk of chunks) {
        data.set(chunk, position)
        position += chunk.length
      }

      this.emit('end', sab)
    }).catch(error => {
      this.emit('error', error)
    })
  }
}

//// => Document
export class Document extends EventEmitter<'progress' | 'end' | 'error' | 'ready'> {
  static create () {
    return new Document() 
  }

   // => loader
   protected _loader: DocumentLoader | null = null
   public get loader () {
     return this._loader
   }
   public set loader (loader: DocumentLoader | null) {
     if (
       this._loader === null || 
       this._loader !== loader
     ) {
       this._loader = loader
     }
   }

  // => root
  protected _root: Element | null = null
  public get root () {
    invariant(this._root !== null)
    return this._root
  }
  public set root (element: Element) {
    if (
      this._root === null ||
      this._root !== element
    ) {
      this._root = element
    }
  }

  // => id 
  public get id () {
    return this.root.id
  }

  load (uri: string): Promise<DocumentLoader> {
    const loader = DocumentLoader.create(uri)

    loader
      .on('error', error => this.emit('error', error))
      .on('progress', progress => this.emit('progress', progress))
      .on('end', sab => this.emit('end', sab))
      .on('end', sab => {
        const { root } = documentRead(new Uint8Array(sab))
        this.root = root
        this.emit('ready', root)
      })
      .request()
    
    return Promise.resolve(this.loader = loader)
  }

  dispose () {
    this.removeAllListeners()
    this.loader?.removeAllListeners()
    this.loader = null
  }
}