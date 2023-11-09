import { defineModel, datetime, transforms, zod, $ } from '.'

const { object, string } = zod

export class User extends defineModel({
  id: $(string()),
  email: $(string().email()),
  aud: $(string()),
  role: $(string()),
  emailConfirmedAt: $(datetime(), transforms.datetime),
  phone: $(string()),
  confirmedAt: $(datetime(), transforms.datetime),
  recoverySentAt: $(datetime(), transforms.datetime),
  lastSignInAt: $(datetime(), transforms.datetime),
  appMetadata: $(object({}).passthrough()),
  userMetadata: $(object({}).passthrough()),
  identities: $(object({}).passthrough().array()),
  createdAt: $(datetime(), transforms.datetime),
  updatedAt: $(datetime(), transforms.datetime),
}) {}
export default User
