export const request = (request: FrameRequestCallback) => globalThis.requestAnimationFrame(request)
export const cancel = (id: number) => globalThis.cancelAnimationFrame(id)