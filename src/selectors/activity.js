'use strict'

const {
  createSelector: memo
} = require('reselect')

const {
  into, compose, map, take, filter
} = require('transducers.js')


const open = compose(
  map(([, activity]) => activity),
  filter(activity => !activity.done || activity.error)
)

const busy = memo(
  ({ activities }) => activities,
  (activities) => into([], compose(open, take(5)), activities)
)

module.exports = {
  busy
}
