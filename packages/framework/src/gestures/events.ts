/*
 * @author: aniwei aniwei.studio@gmail.com
 * @date: 2022-10-30 20:10:43
 */
import invariant from 'ts-invariant'
import { At } from '../at'
import { Matrix4 } from '../basic/matrix4'
import { Offset } from '../basic/geometry'
import { Vector4 } from '../basic/vector4'
import { Vector3 } from '../basic/vector3'
import { toDeviceKind } from '../basic/helper'
import { AtDeviceGestureSettings } from './gesture'
import { Subscribable } from '../basic/subscribable'
import { PointerChange, AtPointerData, PointerDeviceKind, PointerSignalKind, AtPointerDataConverter, AtPointerPacket } from './pointer'

export type PointerEnterEventListener = (event: AtPointerEvent) => void
export type PointerExitEventListener = (event: AtPointerEvent) => void
export type PointerHoverEventListener = (event: AtPointerEvent) => void

export enum PointerEventButtonTypes {
  Primary = 0x1,
  Secondary = 0x2,
  Tertiary = 0x3
}

export type SanitizedDetails = {
  buttons: number,
  change: number
}

export type AtPointerEventOptions = {
  change?: PointerChange,
  embedderId?: number,
  timeStamp?: number,
  pointer?: number,
  kind?: PointerDeviceKind,
  device?: number,
  position?: Offset,
  delta?: Offset,
  buttons?: number,
  down?: boolean,
  obscured?: boolean,
  pressure?: number,
  pressureMin?: number,
  pressureMax?: number,
  distance?: number,
  distanceMax?: number,
  size?: number,
  radiusMajor?: number,
  radiusMinor?: number,
  radiusMin?: number,
  radiusMax?: number,
  orientation?: number,
  tilt?: number,
  platform?: unknown // todo
  synthesized?: boolean
  transform?: Matrix4 | null
  original?: AtPointerEvent | null,
  scrollDelta?: Offset
}

export class AtPointerEvent {
  static removePerspectiveTransform (transform: Matrix4) {
    const vector = new Vector4(0, 0, 1, 0)
    
    const cloned = transform.clone()
    cloned.setColumn(2, vector)
    cloned.setRow(2, vector)

    return cloned
  }

  static transformPosition (transform: Matrix4 | null = null, position: Offset) {
    if (transform == null) {
      return position
    }
    const position3 = new Vector3(position.dx, position.dy, 0.0)
    const transformed3 = transform.perspectiveTransform(position3)
    return new Offset(transformed3.x, transformed3.y)
  }

  static transformDeltaViaPositions(
    untransformedEndPosition: Offset ,
    transformedEndPosition: Offset | null = null,
    untransformedDelta: Offset ,
    transform: Matrix4 | null = null,
  ) {
    if (transform === null) {
      return untransformedDelta
    }
   
    transformedEndPosition ??= AtPointerEvent.transformPosition(transform, untransformedEndPosition)
    const transformedStartPosition = AtPointerEvent.transformPosition(transform, untransformedEndPosition.subtract(untransformedDelta))
    return transformedEndPosition.subtract(transformedStartPosition)
  }

  static create (options: AtPointerEventOptions, transform?: Matrix4 | null) {
    return new AtPointerEvent(
      options.change as PointerChange,
      transform ?? options.transform,
      options.original,
      options.embedderId,
      options.timeStamp,
      options.pointer,
      options.kind,
      options.device,
      options.position,
      options.delta,
      options.buttons,
      options.down,
      options.obscured,
      options.pressure,
      options.pressureMin,
      options.pressureMax,
      options.distance,
      options.distanceMax,
      options.size,
      options.radiusMajor,
      options.radiusMinor,
      options.radiusMin,
      options.radiusMax,
      options.orientation,
      options.tilt,
      options.platform,
      options.synthesized,
      options.scrollDelta
    )
  }

  static createHoverEvent (options: AtPointerEventOptions, transform?: Matrix4 | null) {
    return AtPointerEvent.create({
      ...options,
      change: PointerChange.Hover,
      buttons: At.kPrimaryButton
    }, transform)
  }

  static createMoveEvent (options: AtPointerEventOptions, transform?: Matrix4 | null) {
    return AtPointerEvent.create({
      ...options,
      down: true,
      buttons: At.kPrimaryButton,
      change: PointerChange.Move
    }, transform)
  }

  static createDownEvent (options: AtPointerEventOptions, transform?: Matrix4 | null) {
    return AtPointerEvent.create({
      ...options,
      down: true,
      buttons: At.kPrimaryButton,
      change: PointerChange.Down
    }, transform)
  }

  static createUpEvent (options: AtPointerEventOptions, transform?: Matrix4 | null) {
    return AtPointerEvent.create({
      ...options,
      buttons: 0,
      change: PointerChange.Up
    }, transform)
  }

  static createSignalEvent (options: AtPointerEventOptions, transform?: Matrix4 | null) {
    return AtPointerEvent.create({
      ...options,
      buttons: 0,
      change: PointerChange.Signal
    }, transform)
  }

  static createScrollEvent (options: AtPointerEventOptions, transform?: Matrix4 | null) {
    return AtPointerEvent.create({
      ...options,
      buttons: 0,
      change: PointerChange.Scroll
    }, transform)
  }

  static createCancelEvent (options: AtPointerEventOptions, transform?: Matrix4 | null) {
    return AtPointerEvent.create({
      ...options,
      buttons: 0,
      change: PointerChange.Cancel
    }, transform)
  }

  static createAddedEvent (options: AtPointerEventOptions, transform?: Matrix4 | null) {
    return AtPointerEvent.create({
      ...options,
      buttons: 0,
      change: PointerChange.Add
    }, transform)
  }

  static createRemovedEvent (options: AtPointerEventOptions, transform?: Matrix4 | null) {
    return AtPointerEvent.create({
      ...options,
      buttons: 0,
      change: PointerChange.Remove
    }, transform)
  }

  public get localPosition () {
    return this.position
  }

  public get localDelta () {
    return this.delta
  }

  public change: PointerChange
  public embedderId: number
  public timeStamp: number
  public pointer: number
  public kind: PointerDeviceKind
  public device: number
  public position: Offset
  public delta: Offset
  public buttons: number
  public down: boolean
  public obscured: boolean
  public pressure: number
  public pressureMin: number
  public pressureMax: number
  public distance: number
  public distanceMax: number
  public size: number
  public radiusMajor: number
  public radiusMinor: number
  public radiusMin: number
  public radiusMax: number
  public orientation: number
  public tilt: number
  public platform: unknown // todo
  public synthesized: boolean
  public transform: Matrix4 | null
  public original: AtPointerEvent | null
  public scrollDelta: Offset

  public pan: Offset 
  public get localPan () {
    return this.pan
  }

  public panDelta: Offset
  public get localPanDelta () {
    return this.panDelta
  }
  public scale: number
  public rotation: number

  constructor (
    change: PointerChange,
    transform: Matrix4 | null = null,
    original: AtPointerEvent | null = null,
    embedderId: number = 0,
    timeStamp: number = 0,
    pointer: number = 0,
    kind: PointerDeviceKind = PointerDeviceKind.Touch,
    device: number = 0,
    position: Offset = Offset.zero,
    delta: Offset = Offset.zero,
    buttons: number = 0,
    down: boolean = false,
    obscured: boolean = false,
    pressure: number = 1.0,
    pressureMin: number = 1.0,
    pressureMax: number = 1.0,
    distance: number = 0.0,
    distanceMax: number = 0.0,
    size: number = 0.0,
    radiusMajor: number = 0.0,
    radiusMinor: number = 0.0,
    radiusMin: number = 0.0,
    radiusMax: number = 0.0,
    orientation: number = 0.0,
    tilt: number = 0.0,
    platform: unknown = 0,
    synthesized: boolean = false,
    scrollDelta: Offset = Offset.zero,
    pan: Offset = Offset.zero,
    panDelta: Offset = Offset.zero,
    scale: number = 1.0,
    rotation: number = 1.0
  ) {
    this.change = change
    this.embedderId = embedderId
    this.timeStamp = timeStamp
    this.pointer = pointer
    this.kind = kind
    this.device = device
    this.position = position
    this.delta = delta
    this.buttons = buttons
    this.down = down
    this.obscured = obscured
    this.pressure = pressure
    this.pressureMin = pressureMin
    this.pressureMax = pressureMax
    this.distance = distance
    this.distanceMax = distanceMax
    this.size = size
    this.radiusMajor = radiusMajor
    this.radiusMinor = radiusMinor
    this.radiusMin = radiusMin
    this.radiusMax = radiusMax
    this.orientation = orientation
    this.tilt = tilt
    this.platform = platform
    this.synthesized = synthesized
    this.transform = transform
    this.original = original
    this.scrollDelta = scrollDelta
    this.pan = pan
    this.panDelta = panDelta
    this.scale = scale
    this.rotation = rotation
  }

  transformed (transform: Matrix4 | null): AtPointerEvent {
    if (transform === null || transform.equal(this.transform)) {
      return this
    }

    return AtPointerEvent.create(this.original ?? this, transform)
  }

  copyWith (
    change: PointerChange,
    embedderId: number = 0,
    timeStamp: number = 0,
    pointer: number = 0,
    kind: PointerDeviceKind = PointerDeviceKind.Touch,
    device: number = 0,
    position: Offset = Offset.zero,
    delta: Offset = Offset.zero,
    buttons: number = 0,
    obscured: boolean = false,
    pressure: number = 1.0,
    pressureMin: number = 1.0,
    pressureMax: number = 1.0,
    distance: number = 0.0,
    distanceMax: number = 0.0,
    size: number = 0.0,
    radiusMajor: number = 0.0,
    radiusMinor: number = 0.0,
    radiusMin: number = 0.0,
    radiusMax: number = 0.0,
    orientation: number = 0.0,
    tilt: number = 0.0,
    synthesized: boolean = false
  ): AtPointerEvent {
    return AtPointerEvent.create({
      change,
      transform: this.transform,
      original:  this.original,
      embedderId: embedderId ?? this.embedderId,
      timeStamp: timeStamp ?? this.timeStamp,
      pointer: pointer ?? this.pointer,
      kind: kind ?? this.kind,
      device: device ?? this.device,
      position: position ?? this.position,
      delta: delta ?? this.delta,
      buttons: buttons ?? this.buttons,
      down: this.down,
      obscured: obscured ?? this.obscured,
      pressure: pressure ?? this.pressure,
      pressureMin: pressureMin ?? this.pressureMin,
      pressureMax: pressureMax ?? this.pressureMax,
      distance: distance ?? this.distance,
      distanceMax: distanceMax ?? this.distanceMax,
      size: size ?? this.size,
      radiusMajor: radiusMajor ?? this.radiusMajor,
      radiusMinor: radiusMinor ?? this.radiusMinor,
      radiusMin: radiusMin ?? this.radiusMin,
      radiusMax: radiusMax ?? this.radiusMax,
      orientation: orientation ?? this.orientation,
      tilt: tilt ?? this.tilt,
      platform: this.platform,
      synthesized: synthesized ?? this.synthesized,
    })
  }

  isUp () {
    return this.change === PointerChange.Up
  }

  isDown () {
    return this.change === PointerChange.Down
  }

  isHover () {
    return this.change === PointerChange.Hover
  }

  isMove () {
    return this.change === PointerChange.Move
  }

  isScroll () {
    return this.change === PointerChange.Scroll
  }

  isSignal () {
    return this.change === PointerChange.Signal
  }

  isAdded () {
    return this.change === PointerChange.Add
  }

  isRemoved () {
    return this.change === PointerChange.Remove
  }

  isCancel () {
    return this.change === PointerChange.Cancel
  }

  isZoomStart () {
    return this.change === PointerChange.PanStart
  }

  isZoomUpdate () {
    
  }

  isZoomEnd () {

  }
}

export class AtPointerEventConverter {
  static toLogicalPixels (physicalPixels: number, devicePixelRatio: number) {
    return physicalPixels / devicePixelRatio
  } 

  static expand (data: AtPointerData[], devicePixelRatio: number) {
    return data.filter((data) => data.signalKind !== PointerSignalKind.Unknown).map((data) => {
      const position = new Offset(data.physicalX, data.physicalY).divide(devicePixelRatio)
      const delta = new Offset(data.physicalDeltaX, data.physicalDeltaY).divide(devicePixelRatio)
      const radiusMinor = AtPointerEventConverter.toLogicalPixels(data.radiusMinor, devicePixelRatio)
      const radiusMajor = AtPointerEventConverter.toLogicalPixels(data.radiusMajor, devicePixelRatio)
      const radiusMin = AtPointerEventConverter.toLogicalPixels(data.radiusMin, devicePixelRatio)
      const radiusMax = AtPointerEventConverter.toLogicalPixels(data.radiusMax, devicePixelRatio)

      const timeStamp = data.timeStamp
      const kind = data.kind
      
      invariant(data.change !== null)

      const commons = {
        timeStamp,
        kind,
        position,
        radiusMin,
        radiusMax,
        device: data.device,
        obscured: data.obscured,
        pressureMin: data.pressureMin,
        pressureMax: data.pressureMax,
        distanceMax: data.distanceMax,
        embedderId: data.embedderId,
      }

      switch (data.signalKind ?? PointerSignalKind.None) {
        case PointerSignalKind.None:
          switch (data.change) {
            case PointerChange.Add:
              return AtPointerEvent.createAddedEvent({
                ...commons,
                distance: data.distance,
                orientation: data.orientation,
                tilt: data.tilt
              })
            case PointerChange.Hover:
              return AtPointerEvent.createHoverEvent({
                ...commons,
                buttons: data.buttons,
                delta,
                distance: data.distance,
                orientation: data.orientation,
                radiusMajor,
                radiusMinor,
                size: data.size,
                synthesized: data.synthesized,
                tilt: data.tilt,
              })
            case PointerChange.Down:
              return AtPointerEvent.createDownEvent({
                ...commons,
                radiusMajor,
                radiusMinor,
                pointer: data.pointerIdentifier,
                buttons: synthesiseDownButtons(data.buttons, kind),
                pressure: data.pressure,
                size: data.size,
                orientation: data.orientation,
                tilt: data.tilt,
              })
            case PointerChange.Move:
              return AtPointerEvent.createMoveEvent({
                ...commons,
                delta,
                radiusMajor,
                radiusMinor,
                pointer: data.pointerIdentifier,
                buttons: synthesiseDownButtons(data.buttons, kind),
                pressure: data.pressure,
                size: data.size,
                orientation: data.orientation,
                tilt: data.tilt,
                platform: data.platform,
                synthesized: data.synthesized,
              })
            case PointerChange.Up:
              return AtPointerEvent.createUpEvent({
                ...commons,
                radiusMajor,
                radiusMinor,
                pointer: data.pointerIdentifier,
                buttons: data.buttons,
                pressure: data.pressure,
                distance: data.distance,
                size: data.size,
                orientation: data.orientation,
                tilt: data.tilt,
              })
            case PointerChange.Cancel:
              return AtPointerEvent.createCancelEvent({
                ...commons,
                radiusMajor,
                radiusMinor,
                pointer: data.pointerIdentifier,
                buttons: data.buttons,
                distance: data.distance,
                size: data.size,
                orientation: data.orientation,
                tilt: data.tilt
              })
            case PointerChange.Remove:
              return AtPointerEvent.createMoveEvent({ ...commons })
        }

        case PointerSignalKind.Scroll:
          const scrollDelta = new Offset(data.scrollDeltaX, data.scrollDeltaY).divide(devicePixelRatio)
          return AtPointerEvent.createScrollEvent({
            kind,
            position,
            timeStamp,
            scrollDelta,
            device: data.device,
            embedderId: data.embedderId,
          })
        case PointerSignalKind.Unknown:
          throw Error('Unreachable')
      }
    })
  }
}

export abstract class AtPointerEventDecomposition extends Subscribable {
  private sanitizers: AtPointerEventSanitizers = AtPointerEventSanitizers.create()
  private converter: AtPointerDataConverter = AtPointerDataConverter.create()

  public devicePixelRatio: number

  constructor (devicePixelRatio: number) {
    super()
    this.devicePixelRatio = devicePixelRatio
  }

  handleDownEvent (event: PointerEvent, kind: PointerDeviceKind, device: number) {
    const sanitizer = this.sanitizers.ensure(device) as AtPointerEventSanitizer

    const up: SanitizedDetails | null = sanitizer.sanitizeMissingRightClickUp(event.buttons)
    let results: AtPointerData[] = []

    if (up !== null) {
      results = [...this.convert(event, kind, device, up)]
    }

    const down = sanitizer.sanitizeDownEvent(event.button, event.buttons)
    results = [...results, ...this.convert(event, kind, device, down)]
    
    return results
  }

  handleMoveEvent (event: PointerEvent, kind: PointerDeviceKind, device: number) {
    const sanitizer = this.sanitizers.ensure(device) as AtPointerEventSanitizer

    const up: SanitizedDetails | null = sanitizer.sanitizeMissingRightClickUp(event.buttons)
    let results: AtPointerData[] = []

    if (up !== null) {
      results = [...this.convert(event, kind, device, up)]
    }

    const move = sanitizer.sanitizeMoveEvent(event.buttons)
    results = [...results, ...this.convert(event, kind, device, move)]
    
    return results
  }

  handleUpEvent (event: PointerEvent, kind: PointerDeviceKind, device: number) {
    const sanitizer = this.sanitizers.ensure(device) as AtPointerEventSanitizer
    const details = sanitizer.sanitizeUpEvent(event.buttons)
    
    if (event.pointerType === 'touch') {
      this.sanitizers.delete(event.pointerId)
    }
    
    let results: AtPointerData[] = []

    if (details !== null) {
      results = this.convert(event, kind, device, details)
    }

    return results
  }

  convert (event: PointerEvent, kind: PointerDeviceKind, device: number, details: SanitizedDetails) {
    return this.converter.convert(
      event.timeStamp,
      details.change,
      kind,
      PointerSignalKind.None,
      device,
      event.clientX * this.devicePixelRatio,
      event.clientY * this.devicePixelRatio,
      details.buttons
    )
  }
  
  decomposite (event: PointerEvent) {
    invariant(At.kMouseDeviceId)
    const kind = toDeviceKind(event.pointerType)
    const device =  kind === PointerDeviceKind.Mouse
      ? At.kMouseDeviceId 
      : event.pointerId

    let results: AtPointerData[] = []

    switch (event.type) {
      case 'pointerdown':
        results = this.handleDownEvent(event, kind, device)
        break
      case 'pointermove': 
        results = this.handleMoveEvent(event, kind, device)
        break
      case 'pointerup':
        results = this.handleUpEvent(event, kind, device)
        break
    }

    return AtPointerPacket.create(results ?? [])
  }
}

export class AtPointerEventSanitizer {
  static create () {
    return new AtPointerEventSanitizer()
  }
  
  static convert (button: number) {
    invariant(button >= 0, 'Unexpected negative button $button.')
    
    switch(button) {
      case 0:
        return At.kPrimaryMouseButton
      case 1:
        return At.kMiddleMouseButton
      case 2:
        return At.kSecondaryMouseButton
      default:
        return 
    }
  }
        
  static toFlutterButtons (buttons: number) {
    invariant(At.kButtonsMask)
    return buttons & At.kButtonsMask
  }

  private pressedButtons = 0

  private inferDownFlutterButtons (button: number, buttons: number) {
    if (buttons === 0 && button > -1) {
      buttons = AtPointerEventSanitizer.convert(button) as number
    }

    return AtPointerEventSanitizer.toFlutterButtons(buttons)
  }

  sanitizeDownEvent (
    button: number,
    buttons: number,
  ) {
    if (this.pressedButtons !== 0) {
      return this.sanitizeMoveEvent(buttons)
    }

    this.pressedButtons = this.inferDownFlutterButtons(button, buttons)

    return {
      change: PointerChange.Down,
      buttons: this.pressedButtons,
    }
  }

  sanitizeMoveEvent (buttons: number) {
    const pressedButtons = AtPointerEventSanitizer.toFlutterButtons(buttons)
    
    if (this.pressedButtons === 0 && pressedButtons !== 0) {
      return {
        change: PointerChange.Hover,
        buttons: this.pressedButtons,
      }
    }

    this.pressedButtons = pressedButtons

    return {
      change: this.pressedButtons === 0
          ? PointerChange.Hover
          : PointerChange.Move,
      buttons: this.pressedButtons,
    }
  }

  sanitizeMissingRightClickUp (buttons: number): SanitizedDetails | null {
    const pressedButtons = AtPointerEventSanitizer.toFlutterButtons(buttons)
    if (this.pressedButtons !== 0 && pressedButtons === 0) {
      this.pressedButtons = 0
      return {
        change: PointerChange.Up,
        buttons: this.pressedButtons,
      }
    }

    return null
  }

  sanitizeUpEvent (buttons: number | null) {
    if (this.pressedButtons === 0) {
      return null
    }

    this.pressedButtons = AtPointerEventSanitizer.toFlutterButtons(buttons ?? 0)

    if (this.pressedButtons === 0) {
      return {
        change: PointerChange.Up,
        buttons: this.pressedButtons,
      }
    } else {
      return {
        change: PointerChange.Move,
        buttons: this.pressedButtons,
      }
    }
  }

  sanitizeCancelEvent() {
    this.pressedButtons = 0
    return {
      change: PointerChange.Cancel,
      buttons: this.pressedButtons,
    }
  }
}

export class AtPointerEventSanitizers {
  static create () {
    return new AtPointerEventSanitizers()
  }

  private sanitizers: Map<number, AtPointerEventSanitizer> = new Map()

  ensure (device: number) {
    if (this.sanitizers.has(device)) {
      return this.sanitizers.get(device) as AtPointerEventSanitizer
    }

    const sanitizer = AtPointerEventSanitizer.create()
    this.sanitizers.set(device, sanitizer)
    
    return sanitizer
  }

  delete (device: number) {
    this.sanitizers.delete(device)
  }
}


function synthesiseDownButtons (buttons: number, kind: PointerDeviceKind) {
  switch (kind) {
    case PointerDeviceKind.Mouse:
      return buttons
    case PointerDeviceKind.Touch:
    case PointerDeviceKind.Stylus:
    case PointerDeviceKind.InvertedStylus:
      return buttons === 0 ? At.kPrimaryButton : buttons
    case PointerDeviceKind.Unknown:
      return buttons == 0 ? At.kPrimaryButton : buttons
  }
}


export function computeHitSlop (kind: PointerDeviceKind, settings: AtDeviceGestureSettings | null) {
  switch (kind) {
    case PointerDeviceKind.Mouse:
      return At.kPrecisePointerHitSlop
    case PointerDeviceKind.Stylus:
    case PointerDeviceKind.InvertedStylus:
    case PointerDeviceKind.Unknown:
    case PointerDeviceKind.Touch:
      return settings?.touchSlop ?? At.kTouchSlop
  }
}

export function computePanSlop (kind: PointerDeviceKind, settings: AtDeviceGestureSettings | null) {
  switch (kind) {
    case PointerDeviceKind.Mouse:
      return At.kPrecisePointerPanSlop
    case PointerDeviceKind.Stylus:
    case PointerDeviceKind.InvertedStylus:
    case PointerDeviceKind.Unknown:
    case PointerDeviceKind.Touch:
      return settings?.panSlop ?? At.kPanSlop;
  }
}

export function computeScaleSlop (kind: PointerDeviceKind): number {
  switch (kind) {
    case PointerDeviceKind.Mouse:
      return At.kPrecisePointerScaleSlop;
    case PointerDeviceKind.Stylus:
    case PointerDeviceKind.InvertedStylus:
    case PointerDeviceKind.Unknown:
    case PointerDeviceKind.Touch:
      return At.kScaleSlop
  }
}