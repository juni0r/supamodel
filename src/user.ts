import { defineModel, datetime, transform, zod, $ } from '.'

const { object, string } = zod

export class User extends defineModel({
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
}) {}
export default User
