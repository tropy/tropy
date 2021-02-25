import assert from 'assert'
import { call, fork, join } from 'redux-saga/effects'

// Runs a set of effects in parallel at the given concurrency.
//
// Subtle: currently this does no error handling and does not
// return the effect results, so both should be done in the mapper!
//
export function* parallel(effects, mapper, { concurrency = Infinity }) {
  assert(typeof mapper === 'function', 'mapper function required')
  assert(
    (Number.isSafeInteger(concurrency) || concurrency === Infinity) &&
    concurrency >= 1, 'concurrency must be positive integer')

  concurrency = Math.min(effects.length, concurrency)
  let iterator = effects[Symbol.iterator]()
  let workers = []

  function *worker() {
    while (true) {
      let { value, done } = iterator.next()

      if (done)
        break
      else
        yield call(mapper, value)
    }
  }

  for (let i = 0; i < concurrency; ++i) {
    workers.push(yield fork(worker))
  }

  return join(workers)
}
