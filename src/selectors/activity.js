'use strict'

const {
  createSelector: memo
} = require('reselect')

const {
  into, compose, take, filter
} = require('transducers.js')


const open = filter(activity => !activity.done)

const busy = memo(
  ({ activities }) => activities,
  (activities) => into([], compose(open, take(5)), activities)
)

module.exports = {
  busy
}
