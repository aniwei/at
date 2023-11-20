import { Matrix4, MatrixUtils } from '@at/math'
import { Pointer } from './pointer'
import { invariant } from 'packages/utils/types/lib'

type RouteHandle = (event: Pointer) => void

export class GlobalRouter {
  public routes: Map<RouteHandle, MatrixUtils | null> = new Map()

  use (route: RouteHandle, transform: Matrix4 | null) {
    this.routes.set(route, transform as Matrix4)
  }

  remove (route: RouteHandle) {
    this.routes?.delete(route)
  }
}

export class Router {
  static create () {
    return new Router()
  }

  private routes: Map<number, Map<RouteHandle, Matrix4 | null>> = new Map()
  private global: GlobalRouter = new GlobalRouter()

  private putIfAbsent (pointer: number) {
    if (!this.routes.has(pointer)) {
      this.routes.set(pointer, new Map())
    }

    return this.routes.get(pointer)
  }
  
  use (pointer: number, route: RouteHandle, transform: Matrix4 | null) {
    const routes = this.putIfAbsent(pointer) as Map<RouteHandle, Matrix4 | null>
    routes.set(route, transform as Matrix4)
  }

  delete (pointer: number, route: RouteHandle) {
    invariant(this.routes.has(pointer))
    const routes = this.routes.get(pointer)
    
    routes?.delete(route)
    if (routes?.size === 0) {
      this.routes.delete(pointer)
    }
  }

  route (pointer: Pointer) {
    const routes = this.routes.get(pointer.device) ?? null
    
    if (routes !== null) {
      invariant(routes)
      this.dispatchEventToRoutes(pointer, routes)
    }

    this.dispatchEventToRoutes(pointer, this.global.routes)
  }
  
  dispatch (pointer: Pointer, route: RouteHandle, transform: Matrix4 | null = null) {
    try {
      pointer = pointer.transformed(transform)
      route(pointer)
    } catch (error: any) {
      console.warn(`Caught ProgressEvent with target: ${error.stack}`)
    }
  }

  dispatchEventToRoutes(
    pointer: Pointer,
    reference: Map<RouteHandle, Matrix4 | null>
  ) {
    // reference.forEach((transform: Matrix4 | null, route: RouteHandle) => this.dispatch(event, route, transform))
  }
}
