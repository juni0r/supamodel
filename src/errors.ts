import type { PostgrestError } from '@supabase/postgrest-js'
import type { ZodIssue } from 'zod'
import type { ID } from './types'
import { Issues } from './issues'

export class SupamodelError extends Error {
  cause?: Error

  get name() {
    return this.constructor.name
  }

  constructor(cause: string | Error | PostgrestError) {
    if (typeof cause === 'string') super(cause)
    else {
      super(cause.message)
      this.cause = cause as Error
    }
  }
}

export class RecordNotFound extends SupamodelError {
  constructor(tableName: string, id: ID, cause?: PostgrestError | null) {
    super(cause ?? `No ${tableName} with primary key ${JSON.stringify(id)}`)
  }
}

export class RecordInvalid extends SupamodelError {
  issues: Issues

  constructor(issues: Issues | ZodIssue[]) {
    const { length } = issues
    super(
      `Validation failed with ${length < 2 ? '1 issue' : `${length} issues`}.`,
    )
    this.issues = issues instanceof Issues ? issues : Issues.from(issues)
  }
}

export class RecordNotSaved extends SupamodelError {
  issues = Issues.None
}

export class RecordNotDeleted extends SupamodelError {}
