import { SupabaseClient } from '@supabase/supabase-js'

declare module '@supabase/supabase-js' {
  class SupabaseClient {
    get $mock(): ClientMock

    $on(
      command: RegExp | string,
      handler: (match: RegExpMatchArray) => unknown,
    ): void

    $reset(): void
  }
}

const createClientMock = <DB>(...args: [string, string]) =>
  new ClientMock<DB>(...args)

export default createClientMock

export class ClientMock<DB = any> extends SupabaseClient<DB> {
  commands = [] as string[]
  hooks = [] as CommandHook[]

  get $mock() {
    return this as ClientMock
  }

  from(relation: string) {
    const collector = ['from', relation]

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

  $on(command: RegExp | string, handler: (md: RegExpMatchArray) => unknown) {
    if (typeof command === 'string') {
      command = new RegExp(command)
    }
    this.hooks.push(new CommandHook(command, handler))
  }

  $reset() {
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
        // console.log('CMD', target, then, then())
        return (resolve: (val: unknown) => unknown) =>
          resolve(Promise.resolve(then()))
      }
      return (...args: any[]) => {
        push.call(target, key, ...args.map(inspect))
        return proxy
      }
    },
  }) as any
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
