import type { TransformFn } from './types'
import { identity } from './util'

export class Transform<Int = any, Ext = any> {
  constructor(
    public column: string,
    public take: TransformFn<Ext, Int> = identity<any>,
    public emit: TransformFn<Int, Ext> = identity<any>,
  ) {}
}
export default Transform
