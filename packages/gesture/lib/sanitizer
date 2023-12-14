//// => Sanitizer
export class Sanitizer {
  static sanitizers: Map<number, Sanitizer> = new Map()

  static ensure (device: number) {
    if (!this.sanitizers.has(device)) {
      const sanitizer = Sanitizer.create()
      this.sanitizers.set(device, sanitizer)
    }
    
    return this.sanitizers.get(device) as Sanitizer
  }

  static create () {
    return new Sanitizer()
  }

  protected pressedButtons: number = 0

  sanitize (type: string, packet: PointerPacket) {
    switch (type) {
      case 'pointerdown': {
        if (this.pressedButtons !== 0) {
          return this.sanitize('pointermove', packet)
        }
        break
      }

      case 'pointermove': {
        const pressedButtons = packet.buttons
        if (
          this.pressedButtons === 0 && 
          pressedButtons !== 0
        ) {
          packet.change = PointerChangeKind.Hover
          packet.buttons = this.pressedButtons
        } else {
          this.pressedButtons = pressedButtons
          packet.change = this.pressedButtons === 0 
            ? PointerChangeKind.Hover
            : PointerChangeKind.Move
        }

        this.pressedButtons = this.pressedButtons
        break
      }

      case 'pointerup': {

        break
      }
    }
  }
}