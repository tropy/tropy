import debounce from 'lodash.debounce'

const middleware = () => next => {
  const dnxt = debounce(next, 25)

  return action => {
    const { meta } = action

    return (meta && meta.debounce) ?
      dnxt(action) :
      next(action)
  }
}

export {
  middleware as debounce
}
