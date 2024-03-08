export const periodic = (callback: VoidFunction, duration: number) => {
  return setInterval(callback, duration)  
}