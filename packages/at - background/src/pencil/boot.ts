
import { At } from '@at/framework'

import { AtPencil } from './pencil'
import { AtDocument, AtDocumentConfiguration, AtDocumentConfigurationJSON } from './element/document'
import { AtPage } from './element/page'
import { createExample } from './example'

const main = async () => {
  const pencil = await At.WorkerApp.wait<
    AtDocument,
    AtDocumentConfiguration, 
    AtPencil<AtDocumentConfiguration>,
    AtDocumentConfigurationJSON
  >((canvas: HTMLCanvasElement, json: AtDocumentConfigurationJSON) => {
    return AtPencil.create(
      canvas, 
      AtDocumentConfiguration.fromJSON(json as AtDocumentConfigurationJSON)
    )
  })

  const document = AtDocument.create({
    id: `1`,
    name: `doc`,
    configuration: pencil.configuration
  })

  // const page = AtPage.create()  
  // pencil.document = await AtDocument.fromURL(`/figma.json`, pencil.configuration as AtDocumentConfiguration)  

  createExample(document)

  pencil.document = document
}

main()
