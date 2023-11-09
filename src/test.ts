import 'dotenv/config'
import './luxon.inspect.custom'
// import Session from './session'
import { configureSupamodel } from './config'

const { SUPABASE_URL: url = '', SUPABASE_KEY: key = '' } = process.env

configureSupamodel({ client: { key, url } })

import('./session').then(async ({ default: Session }) => {
  Session.signInWithPassword({
    email: 'andreas.korth@gmail.com',
    password: 'rosebush',
  }).then(async (session) => {
    console.dir(session.toJSON(), { depth: 5 })
  })
})
