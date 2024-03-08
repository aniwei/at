// Manifest
export interface Font {
  family: string,
  dir: string
}

export interface Manifest {
  protocol: string,
  fonts: Font[],
  theme: {}
}
