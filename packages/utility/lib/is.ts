import { invariant } from 'ts-invariant'
import { RRect } from '@at/geometry'

export function rrectIsValid (rrect: RRect) {
  invariant(rrect !== null, 'RRect argument was null.')
  invariant(
    !(isNaN(rrect.left) || isNaN(rrect.right) || isNaN(rrect.top) || isNaN(rrect.bottom)),
    'RRect argument contained a NaN value.'
  )

  return true
}