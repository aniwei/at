import { invariant } from '@at/utils'
import { Size } from '../basic/geometry'
import { AtLayoutBox } from './box'
import { AtBoxConstraints } from './box-constraints'

export type ChildLayouter = (child: AtLayoutBox, constraints: AtBoxConstraints) => Size


export class ChildLayout {
  static dryLayoutChild (child: AtLayoutBox, constraints: AtBoxConstraints): Size {
    return child.getDryLayout(constraints)
  }

  static layoutChild (child: AtLayoutBox, constraints: AtBoxConstraints): Size {
    child.layout(constraints, true)

    invariant(child.size, `The "child.size" cannot be null.`)
    return child.size
  }
}
