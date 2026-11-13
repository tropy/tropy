import { createSelector as memo } from '@reduxjs/toolkit'
import { into, compose, map, filter } from 'transducers.js'

const values = ([, value]) => value
const busy = compose(map(values), filter(a => !a.done && !a.hidden))


export const getActivities = memo(
  ({ activities }) => activities,
  (activities) => into([], busy, activities)
)
