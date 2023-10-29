import { ZodError, type ZodIssue } from 'zod'

export default class Issues extends Array<ZodIssue> {
  static from(issues: ZodIssue[]) {
    return Object.setPrototypeOf(issues, this.prototype) as Issues
  }

  static none() {
    return this.from([])
  }

  static handle(error: unknown) {
    if (!(error instanceof ZodError)) throw error
    return this.from(error.issues)
  }

  get any() {
    return this.length > 0
  }

  get none() {
    return this.length === 0
  }
}
