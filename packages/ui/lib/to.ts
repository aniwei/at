import { Skia, AtEngine } from '@at/engine'

export function axisDirectionToAxis (axisDirection: Skia.AxisDirectionKind): Skia.AxisKind {
  switch (axisDirection) {
    case AtEngine.skia.AxisDirectionKind.Up:
    case AtEngine.skia.AxisDirectionKind.Down:
      return AtEngine.skia.AxisKind.Vertical
    case AtEngine.skia.AxisDirectionKind.Left:
    case AtEngine.skia.AxisDirectionKind.Right:
      return AtEngine.skia.AxisKind.Horizontal
  }
}

export function flipScrollDirection (direction: Skia.ScrollDirectionKind): Skia.ScrollDirectionKind {
  switch (direction) {
    case AtEngine.skia.ScrollDirectionKind.Idle:
      return AtEngine.skia.ScrollDirectionKind.Idle
    case AtEngine.skia.ScrollDirectionKind.Forward:
      return AtEngine.skia.ScrollDirectionKind.Reverse
    case AtEngine.skia.ScrollDirectionKind.Reverse:
      return AtEngine.skia.ScrollDirectionKind.Forward
  }
}

export function flipAxisDirection (axisDirection: Skia.AxisDirectionKind): Skia.AxisDirectionKind {
  switch (axisDirection) {
    case AtEngine.skia.AxisDirectionKind.Up:
      return AtEngine.skia.AxisDirectionKind.Down;
    case AtEngine.skia.AxisDirectionKind.Right:
      return AtEngine.skia.AxisDirectionKind.Left;
    case AtEngine.skia.AxisDirectionKind.Down:
      return AtEngine.skia.AxisDirectionKind.Up;
    case AtEngine.skia.AxisDirectionKind.Left:
      return AtEngine.skia.AxisDirectionKind.Right;
  }
}