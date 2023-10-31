/**
 * Based on type equality method from:
 * https://stackoverflow.com/questions/53807517/how-to-test-if-two-types-are-exactly-the-same
 *
 * declare const exactType: <T, U>(
 *   draft: T & IfEquals<T, U>,
 *   expected: U & IfEquals<T, U>,
 * ) => IfEquals<T, U>
 *
 */
// prettier-ignore
type IfEquals<T, U, Y=unknown, N=never> =
  (<G>() => G extends T ? 1 : 2) extends
  (<G>() => G extends U ? 1 : 2) ? Y : N

export const Expect =
  <T>() =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  <U>(expected: U & IfEquals<T, U>, _draft?: T & IfEquals<T, U>) =>
    expected
