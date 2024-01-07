import { Skia, Engine } from '@at/engine'

export function axisDirectionToAxis (axisDirection: Skia.AxisDirection): Skia.Axis {
  switch (axisDirection) {
    case Engine.skia.AxisDirection.Up:
    case Engine.skia.AxisDirection.Down:
      return Engine.skia.Axis.Vertical
    case Engine.skia.AxisDirection.Left:
    case Engine.skia.AxisDirection.Right:
      return Engine.skia.Axis.Horizontal
  }
}

export function flipScrollDirection (direction: Skia.ScrollDirection): Skia.ScrollDirection {
  switch (direction) {
    case Engine.skia.ScrollDirection.Idle:
      return Engine.skia.ScrollDirection.Idle
    case Engine.skia.ScrollDirection.Forward:
      return Engine.skia.ScrollDirection.Reverse
    case Engine.skia.ScrollDirection.Reverse:
      return Engine.skia.ScrollDirection.Forward
  }
}

export function flipAxisDirection (axisDirection: Skia.AxisDirection): Skia.AxisDirection {
  switch (axisDirection) {
    case Engine.skia.AxisDirection.Up:
      return Engine.skia.AxisDirection.Down;
    case Engine.skia.AxisDirection.Right:
      return Engine.skia.AxisDirection.Left;
    case Engine.skia.AxisDirection.Down:
      return Engine.skia.AxisDirection.Up;
    case Engine.skia.AxisDirection.Left:
      return Engine.skia.AxisDirection.Right;
  }
}