// prettier-ignore
type IfEquals<T, U, Y=unknown, N=never> =
  (<G>() => G extends T ? 1 : 2) extends
  (<G>() => G extends U ? 1 : 2) ? Y : N

// declare const exactType: <T, U>(
//   draft: T & IfEquals<T, U>,
//   expected: U & IfEquals<T, U>,
// ) => IfEquals<T, U>

// interface Exact<T> {
//   <U>(expected: U & IfEquals<T, U>, draft?: T & IfEquals<T, U>): IfEquals<T, U>
// }

export const Expect =
  <T>() =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  <U>(expected: U & IfEquals<T, U>, _draft?: T & IfEquals<T, U>) =>
    expected

const a: string = ''
const b = 23

Expect<string>()(a)
Expect<string>()(b)
