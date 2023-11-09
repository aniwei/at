// Manifest
export interface Font {
  family: string,
  dir: string
}

export interface AtManifest {
  protocol: string,
  fonts: Font[],
  theme: {}
}
