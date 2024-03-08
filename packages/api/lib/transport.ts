import { MessagePort, WorkPort, WorkTransport } from '@at/basic'

export class ApiTransport extends WorkTransport { 
  static connect (port: MessagePort) {
    const transport = new ApiTransport()
    transport.connect(port)
    return transport
  }


  connect (port: MessagePort) {
    super.connect(new WorkPort(port as unknown as MessagePort))
  }
}