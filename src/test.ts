import 'dotenv/config'
import './luxon.inspect.custom'
import { defineModel, datetime, transform, $, zod, configureSupamodel } from '.'

configureSupamodel({})

interface Credentials {
  email: string
  password: string
}

const { object, string } = zod

class User extends defineModel({
  id: $(string()),
  email: $(string().email()),
  aud: $(string()),
  role: $(string()),
  emailConfirmedAt: $(datetime(), transform.datetime),
  phone: $(string()),
  confirmedAt: $(datetime(), transform.datetime),
  recoverySentAt: $(datetime(), transform.datetime),
  lastSignInAt: $(datetime(), transform.datetime),
  appMetadata: $(object({}).passthrough()),
  userMetadata: $(object({}).passthrough()),
  identities: $(object({}).passthrough().array()),
  createdAt: $(datetime(), transform.datetime),
  updatedAt: $(datetime(), transform.datetime),
}) {
  static async signInWithPassword(credentials: Credentials) {
    const { data, error } =
      await this.client.auth.signInWithPassword(credentials)
    if (error) throw error

    // console.dir(data, { depth: 6 })
    return this.take(data.user)
  }

  static async instance() {
    const { data, error } = await this.client.auth.getUser()
    if (error) throw error

    return this.take(data.user)
  }
}

User.signInWithPassword({
  email: 'andreas.korth@gmail.com',
  password: 'rosebush',
}).then(async (user) => {
  console.log(user.toJSON())
  console.log('\ninstance:')
  console.log((await User.instance()).toJSON())
})
