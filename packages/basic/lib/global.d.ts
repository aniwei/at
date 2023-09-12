export type VoidCallback = () => void

export interface ListLike<T> extends ArrayLike<T>, Iterator<T> {
  [Symbol.iterator](): Iterator<T>
}