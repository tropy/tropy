
// Helper for creating perpare/reducer object for RTK reducers
export const createMetaReducer = (props, reducer) => ({
  prepare: (payload, meta = {}) => ({
    payload,
    meta: { ...props, ...meta }
  }),
  reducer
})

export const cmdReducer = (reducer, name = 'project') =>
  createMetaReducer({ cmd: name }, reducer)

