import { Matrix4 } from '@at/math'
import type { SanitizedPointerEvent } from './sanitizer'

type RouteHandle = (event: SanitizedPointerEvent) => void

export interface SanitizedEventDispatcherFactory<T> {
  new (...rests: unknown[]): T,
  create (...rests: unknown[]): T
}
export class SanitizedEventDispatcher {
  static create <T> (...rests: unknown[]) {
    const EventDispatcherFactory = this as unknown as SanitizedEventDispatcherFactory<T>
    return new EventDispatcherFactory(...rests)
  }

  protected routes: Map<number, Map<RouteHandle, Matrix4 | null>> = new Map()

  put (id: number, route: RouteHandle, transform: Matrix4 | null) {
    let r = this.routes.get(id) ?? null
    if (r === null) {
      r = new Map()
      this.routes.set(id, r)
    }

    r.set(route, transform)
  }

  use (route: RouteHandle, transform: Matrix4 | null): void
  use (id: number, route: RouteHandle, transform: Matrix4 | null): void
  use (id: number | RouteHandle, route: RouteHandle | Matrix4 | null, transform: Matrix4 | null = null): void {
    if (typeof id === 'function') {
      transform = route as Matrix4
      route = id as RouteHandle
      id = -1
    }

    this.put(id, route as RouteHandle, transform as Matrix4)
  }

  delete (route: RouteHandle): boolean
  delete (id: number, route: RouteHandle): boolean
  delete (id: number | RouteHandle, route?: RouteHandle): boolean {
    if (typeof id === 'function') {
      route = id
      id = -1
    }

    const r = this.routes.get(id) ?? null
    if (r !== null) {
      const result = r.delete(route as RouteHandle)

      if (r.size === 0) {
        this.routes.delete(id)
      }

      return result
    }

    return false
  }

  route (event: SanitizedPointerEvent) {
    const routes = this.routes.get(event.id) ?? null
    
    if (routes !== null) {
      this.dispatch(event, routes)
    }
  }

  dispatch (event: SanitizedPointerEvent, routes: Map<RouteHandle, Matrix4 | null>) {
    for (const [route, transform] of routes) {    
      try {
        route(event.transformed(transform))
      } catch (error: any) {
        console.warn(`Caught ProgressEvent with target: ${error.stack}`)
      }
    }
  }
}

