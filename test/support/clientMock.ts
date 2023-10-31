import { SupabaseClient } from '@supabase/supabase-js'
// import util from 'node:util'

const createClientMock = () => new ClientMock()
export default createClientMock

export class ClientMock {
  commands = [] as string[]
  hooks = [] as CommandHook[]

  get mock() {
    return this as unknown as SupabaseClient
  }

  from(table: string) {
    const collector = ['from', table]

    return commandProxy(collector, () => {
      const command = collector.join(' ')
      this.commands.push(command)

      let result: unknown = undefined

      for (const hook of this.hooks) {
        result = hook.execute(command)
        if (result !== undefined) break
      }
      return result
    })
  }

  on(regexp: RegExp | string, handler: (md: RegExpMatchArray) => unknown) {
    if (typeof regexp === 'string') {
      regexp = new RegExp(regexp)
    }
    this.hooks.push(new CommandHook(regexp, handler))
  }

  reset() {
    this.commands = []
    this.hooks = []
  }
}

class CommandHook {
  constructor(
    public regexp: RegExp,
    public resolve: (md: RegExpMatchArray) => unknown,
  ) {}
  execute(command: string) {
    const matched = command.match(this.regexp)
    return matched && this.resolve(matched)
  }
}

const { push } = Array.prototype

function commandProxy(command: string[] = [], then: () => unknown) {
  const proxy = new Proxy(command, {
    get(target, key) {
      if (key === 'then') {
        // console.log('CMD', target)
        return (cb: (val: unknown) => unknown) => cb(Promise.resolve(then()))
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (...args: any[]) => {
        push.call(target, key, ...args.map(inspect))
        return proxy
      }
    },
  }) as string[]
  return proxy
}

function inspect(value: object | string | number | boolean): string {
  switch (typeof value) {
    case 'object':
      return Array.isArray(value)
        ? `[${value.map(inspect).join(', ')}]`
        : `{ ${Object.entries(value)
            .reduce(
              (acc, [key, val]) => [...acc, `${key}: ${inspect(val)}`],
              [] as string[],
            )
            .join(', ')} }`
    case 'string':
      return `'${value}'`
  }
  return String(value)
}
