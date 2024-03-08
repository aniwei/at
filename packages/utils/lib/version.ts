export interface Version {
  x: number,
  y: number,
  z: number
}

export interface PackageJSON {
  version: string
}

export const getVersion = (pkg: PackageJSON) => {
  const keys: (keyof Version)[] = ['x', 'y', 'z']
  return pkg.version.split('.').reduce((version: Version, v: string, index: number) => {
    const k: keyof Version = keys[index]
    version[k] = Number(v)

    return version
  }, {
    x: 0,
    y: 0,
    z: 0
  })
}