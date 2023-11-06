import 'dotenv/config'
import './luxon.inspect.custom'
import Session from './session'
import { configureSupamodel } from '.'

configureSupamodel({})

Session.signInWithPassword({
  email: 'andreas.korth@gmail.com',
  password: 'rosebush',
}).then(async (session) => {
  console.dir(session.toJSON(), { depth: 5 })
})
