export const decoder = new TextDecoder()

export const decode = (data: Uint8Array) => {
  return decoder.decode(data)
}