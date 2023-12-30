import { Skia, Engine } from '@at/engine'

export function axisDirectionToAxis (axisDirection: Skia.AxisDirectionKind): Skia.AxisKind {
  switch (axisDirection) {
    case Engine.skia.AxisDirectionKind.Up:
    case Engine.skia.AxisDirectionKind.Down:
      return Engine.skia.AxisKind.Vertical
    case Engine.skia.AxisDirectionKind.Left:
    case Engine.skia.AxisDirectionKind.Right:
      return Engine.skia.AxisKind.Horizontal
  }
}

export function flipScrollDirection (direction: Skia.ScrollDirectionKind): Skia.ScrollDirectionKind {
  switch (direction) {
    case Engine.skia.ScrollDirectionKind.Idle:
      return Engine.skia.ScrollDirectionKind.Idle
    case Engine.skia.ScrollDirectionKind.Forward:
      return Engine.skia.ScrollDirectionKind.Reverse
    case Engine.skia.ScrollDirectionKind.Reverse:
      return Engine.skia.ScrollDirectionKind.Forward
  }
}

export function flipAxisDirection (axisDirection: Skia.AxisDirectionKind): Skia.AxisDirectionKind {
  switch (axisDirection) {
    case Engine.skia.AxisDirectionKind.Up:
      return Engine.skia.AxisDirectionKind.Down;
    case Engine.skia.AxisDirectionKind.Right:
      return Engine.skia.AxisDirectionKind.Left;
    case Engine.skia.AxisDirectionKind.Down:
      return Engine.skia.AxisDirectionKind.Up;
    case Engine.skia.AxisDirectionKind.Left:
      return Engine.skia.AxisDirectionKind.Right;
  }
}