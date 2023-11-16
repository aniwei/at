import { invariant } from '@at/utils'
import { Size } from '@at/geometry'
import { Box } from './box'
import { BoxConstraints } from './constraints'

export type ChildLayouter = (child: Box, constraints: BoxConstraints) => Size


export class ChildLayout {
  static dryLayoutChild (child: Box, constraints: BoxConstraints): Size {
    return child.getDryLayout(constraints)
  }

  static layoutChild (child: Box, constraints: BoxConstraints): Size {
    child.layout(constraints, true)

    invariant(child.size, `The "child.size" cannot be null.`)
    return child.size
  }
}
