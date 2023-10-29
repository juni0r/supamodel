import type { PostgrestError } from '@supabase/postgrest-js'
import { assign } from './util'
import type { Id } from './types'

export class RecordNotFound extends Error {
  constructor(tableName: string, id: Id) {
    super(`No ${tableName} with primary key ${JSON.stringify(id)}`) // (1)
    this.name = 'RecordNotFound' // (2)
  }
}

export class DatabaseError extends Error implements PostgrestError {
  details!: string
  hint!: string
  code!: string

  constructor({ message, ...error }: PostgrestError) {
    super(message) // (1)
    assign(this, error, { name: 'DatabaseError' }) // (3)
  }
}

export class RecordNotCreated extends DatabaseError {
  constructor({ message, ...error }: PostgrestError) {
    super({ message: `Record not created: ${message}`, ...error }) // (1)
    assign(this, error, { name: 'RecordNotCreated' }) // (3)
  }
}

export class RecordNotUpdated extends DatabaseError {
  constructor({ message, ...error }: PostgrestError) {
    super({ message: `Record not updated: ${message}`, ...error }) // (1)
    assign(this, error, { name: 'RecordNotUpdated' }) // (3)
  }
}

export class RecordNotDeleted extends DatabaseError {
  constructor({ message, ...error }: PostgrestError) {
    super({ message: `Record not deleted: ${message}`, ...error }) // (1)
    assign(this, error, { name: 'RecordNotDeleted' }) // (3)
  }
}
