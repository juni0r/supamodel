import type { ModelClass } from '../model'
export type { ModelClass }

export abstract class Relation<
  Source extends ModelClass,
  Target extends ModelClass,
> {
  constructor(
    public source: Source,
    public target: Target,
    public key: keyof InstanceType<Source>,
    public foreignKey: keyof InstanceType<Target>,
  ) {}

  scope(source: InstanceType<Source>): [string, any] {
    return [this.foreignKey as string, source[this.key] as string]
  }
}
export default Relation
