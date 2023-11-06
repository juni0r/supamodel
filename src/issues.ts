import { ZodError, type ZodIssue } from 'zod'

export class Issues extends Array<ZodIssue> {
  static None = Object.freeze(this.from([]))

  static from(issues: ZodIssue[]) {
    return Object.setPrototypeOf(issues, this.prototype) as Issues
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
export default Issues
