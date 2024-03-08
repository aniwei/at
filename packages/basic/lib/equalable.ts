
//// => Equalable
export abstract class Equalable<T extends Equalable<T>> {
  abstract equal (object: T | null): boolean
  abstract notEqual (object: T | null): boolean
}