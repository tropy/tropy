'use strict'

const {
  createSelector: memo
} = require('reselect')

const {
  into, compose, map, filter
} = require('transducers.js')


const busy = memo(
  ({ activities }) => activities,
  (activities) =>
    into([], compose(
        map(([, activity]) => activity),
        filter(activity => !activity.done)
      ), activities)
)

module.exports = {
  busy
}
