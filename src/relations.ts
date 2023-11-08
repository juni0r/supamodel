import BaseModel from './baseModel'

type Model = typeof BaseModel

abstract class Relation<Source extends Model, Target extends Model> {
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

export class HasMany<
  Source extends Model,
  Target extends Model,
> extends Relation<Source, Target> {
  async loadTarget(
    source: InstanceType<Source>,
  ): Promise<InstanceType<Target>[]> {
    const { data, error } = await this.target.findAll((where) =>
      where.eq(...this.scope(source)),
    )
    if (error) throw error
    return data
  }

  async updateTarget(
    source: InstanceType<Source>,
    target: InstanceType<Target>[],
  ) {
    target.reduce(
      (updates, item) => {
        if (item[this.foreignKey] !== (source[this.key] as string)) {
          updates.push(
            item
              .updateAttributes({ [this.foreignKey]: source[this.key] } as any)
              .then(({ data, error }) => {
                if (error) throw error
                return data
              }),
          )
        }
        return updates
      },
      [] as Promise<InstanceType<Target>>[],
    )
  }
}

export class BelongsTo<
  Source extends Model,
  Target extends Model,
> extends Relation<Source, Target> {
  async loadTarget(
    source: InstanceType<Source>,
  ): Promise<InstanceType<Target> | null> {
    const { data, error } = await this.target.findOne((where) =>
      where.eq(...this.scope(source)),
    )
    if (error) throw error
    return data
  }
}

export class HasOne<
  Source extends Model,
  Target extends Model,
> extends Relation<Source, Target> {
  async loadTarget(
    source: InstanceType<Source>,
  ): Promise<InstanceType<Target> | null> {
    const { data, error } = await this.target.findOne((where) =>
      where.eq(...this.scope(source)),
    )
    if (error) throw error
    return data
  }
}
