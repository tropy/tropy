/*
 * An approximation of Bluebird's .disposer() / .using() pattern
 */

export class DisposableResource {
  constructor(resource, dispose) {
    this.promise = Promise.resolve(resource)
    this.dispose = dispose
  }
}

export async function using({ promise, dispose }, callback) {
  if (!promise || !Function.isFunction(dispose))
    throw new Error('using() called without a disposable resource')

  let resource = await promise

  try {
    return await callback(resource)

  } finally {
    await dispose(resource)
  }
}
