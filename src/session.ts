import { defineModel, zod, $ } from '.'
import { SupamodelError } from './errors'
import User from './user'
import { asData, failWith } from './util'

export interface Credentials {
  email: string
  password: string
}

const { custom, string, number } = zod

export class Session extends defineModel({
  access_token: $(string()),
  tokenType: $(string()),
  expiresIn: $(number()),
  expiresAt: $(number()),
  refreshToken: $(string()),
  user: $(
    custom<User>((val: unknown) => val instanceof User, {
      message: 'Invalid User',
      params: { code: 'invalid-user' },
    }),
    {
      take: (data) => User.take(data),
      emit: (user) => user.$emit(),
    },
  ),
}) {
  static async signInWithPassword(credentials: Credentials) {
    const { data, error } =
      await this.client.auth.signInWithPassword(credentials)
    if (error) throw error

    // console.dir(data, { depth: 6 })
    return this.take(data.session)
  }

  static async getUser() {
    const { data, error } = await this.client.auth.getUser()
    if (error) return failWith(SupamodelError, error)

    return asData(User.take(data.user))
  }
}
export default Session
