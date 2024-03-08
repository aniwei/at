export const encoder = new TextEncoder()

export const encode = (string: string, ) => {
  return encoder.encode(string)
}