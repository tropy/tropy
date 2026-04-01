import { throttle } from '../common/util.js'

const middleware = () => next => {
  const tnxt = throttle(next, 125)

  return action => {
    const { meta } = action

    return (meta && meta.throttle) ?
      tnxt(action) :
      next(action)
  }
}

export {
  middleware as throttle
}
