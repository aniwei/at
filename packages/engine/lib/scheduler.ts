import { AssetsManager } from '@at/asset'
import { raf } from '@at/basic'

export enum SchedulerPhaseKind {
  Request,
  Idle,
  Transient,
  Persistent
}

export interface TransientCallback {
  (t: number): void
}

export interface PersistentCallback {
  (t: number): void
}

export abstract class Scheduler extends AssetsManager {
  // 时间戳
  public t: number = Date.now()
  // 阶段
  public phase: SchedulerPhaseKind = SchedulerPhaseKind.Idle
  // requestAnimationFrame id
  protected rafId: number | null = null
  // 短暂任务
  protected transients: TransientCallback[] = []
  // 必须任务，光栅化
  protected persistents: PersistentCallback[] = []


  registerPersistent (callback: PersistentCallback) {
    if (!this.persistents.includes(callback)) {
      this.persistents.push(callback)
    }
  }

  unregisterPersistent (callback: PersistentCallback) {
    if (this.persistents.includes(callback)) {
      const index = this.persistents.indexOf(callback)
      this.persistents.splice(index)
    }
  }

  registerTransient (callback: TransientCallback) {
    if (!this.transients.includes(callback)) {
      this.transients.push(callback)
    }
  }

  unregisterTransient (callback: TransientCallback) {
    if (this.transients.includes(callback)) {
      const index = this.transients.indexOf(callback)
      this.transients.splice(index)
    }
  }

  schedule () {
    // 空闲
    if (this.phase === SchedulerPhaseKind.Idle) {
      this.phase = SchedulerPhaseKind.Request

      this.emit('schedulestatechange', 'request', this)
      this.rafId = raf.request(() => this.perform())
    }
  }

  perform () {
    this.t = Date.now()
    
    this.phase = SchedulerPhaseKind.Transient
    this.emit('schedulestatechange', 'performtransient', this)

    for (const transient of this.transients) {
      transient(this.t)
    }

    this.phase = SchedulerPhaseKind.Persistent
    this.emit('schedulestatechange', 'performpersistent', this)

    for (const persistent of this.persistents) {
      persistent(this.t)
    }

    this.phase = SchedulerPhaseKind.Idle
    this.emit('schedulestatechange', 'idle', this.t)
  }
}