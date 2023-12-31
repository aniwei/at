
export const request = (callback: IdleRequestCallback, options?: IdleRequestOptions) => {
  if (typeof globalThis.requestIdleCallback === 'function') {
    return global.requestIdleCallback(callback, options)
  }
  const start = Date.now()
  
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: function () {
        return Math.max(0, 50 - (Date.now() - start));
      }
    })
  }, 0)
}

export const cancel = (id: number) => {
  if (typeof globalThis.cancelIdleCallback === 'function') {
    return globalThis.cancelIdleCallback(id)
  }

  return clearTimeout(id)
}