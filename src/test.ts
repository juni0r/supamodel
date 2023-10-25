import { defineModel, attr as $ } from '.'
import { string, number, date } from 'zod'

const Model = defineModel({
  id: $(number(), { primary: true }),

  firstName: $(string()),
  lastName: $(string(), { column: 'family_name' }),

  date: $(date(), {
    take: (val: string) => new Date(val),
    emit: (val: Date) => val.toISOString(),
  }),
})

const m = new Model({
  id: 12345,
  first_name: 'Stella',
  family_name: 'Goldbacke',
  date: '2020-02-02T02:02:02.020Z',
})

console.log(m.$attributes)
console.log(m.id)
console.log(m.firstName)
console.log(m.lastName)
console.log(m.date)
console.log(m.$model.$attributes.lastName.column)
console.log(m.$model.$schema.shape.lastName._def.typeName)
