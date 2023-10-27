import { SupabaseClient } from '@supabase/supabase-js'
import util from 'node:util'

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

      console.log(command)
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
  // console.log(...command)
  const proxy = new Proxy(command, {
    get(target, key) {
      if (key === 'then')
        return (cb: (val: unknown) => unknown) => cb(Promise.resolve(then()))

      return (...args: unknown[]) => {
        // console.log(key, ...args)
        push.call(target, key, ...args.map((arg) => util.inspect(arg)))
        return proxy
      }
    },
  })
  return proxy
}
