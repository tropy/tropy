'use strict'

const { createSelector: memo } = require('reselect')
const { into, compose, map, filter } = require('transducers.js')

const values = ([, value]) => value
const busy = compose(map(values), filter(a => !a.done))


const getActivities = memo(
  ({ activities }) => activities,
  (activities) => into([], busy, activities)
)

module.exports = {
  getActivities
}
