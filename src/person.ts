import { string } from 'zod'
import { model } from './model'

class Person extends model({
  givenName: string(),
  familyName: string(),
}) {
  get name() {
    return `${this.givenName} ${this.familyName}`
  }
}

const person = new Person()

person.$attributes = { given_name: 'Stella', family_name: 'Goldbacke' }
console.log(person.givenName)
console.log(person.familyName)

person.givenName = 'Tom'
console.log(person.name)
