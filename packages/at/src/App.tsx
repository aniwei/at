
import { At, Size } from '@at/framework'
import { useMemo } from 'react'
import { AtWorkerPencil } from './pencil/pencil'
import { AtDocumentConfiguration } from './pencil/element/document'

const usePencil = (file: string) => {
  const design = useMemo(() => {
    return AtWorkerPencil.create({
      file,
      configuration: AtDocumentConfiguration.create({
        size: Size.create(
          window.innerWidth,
          window.innerHeight
        ),
        devicePixelRatio: window.devicePixelRatio,
        baseURL: location.href,
        assetsDir: 'assets',
        theme: {
          highlightColor: At.Color.fromRGBO(0, 110, 243, 1),
          layerBackgroundColor: At.Color.fromRGBO(217, 217, 217, 1),
          layerHighlightColor: At.Color.fromRGBO(0, 110, 243, 1),
          layerBorderColor: At.Color.fromRGBO(0, 110, 243, 1),
          layerBorderWidth: 1.5,
          layerAnchorBorderColor: At.Color.fromRGBO(0, 110, 243, 1),
          layerAnchorColor: At.Color.fromRGBO(255, 255, 255, 1),
          layerAnchorWidth: 8,
        }
      })
    })
  }, [])
  return design
}

function App() {
  

  const pencil = usePencil('./src/pencil/boot.ts')
  pencil.start().then(() => {
    // pencil.inspector.stage.dispatchDragEvent('dragStart', 10, 20)
  })

  
  

  return <></>
}

export default App
