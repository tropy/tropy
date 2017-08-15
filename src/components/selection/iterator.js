'use strict'

const React = require('react')
const { Iterator } = require('../iterator')
const { arrayOf, number, string } = require('prop-types')


class SelectionIterator extends Iterator {
  get iteration() {
    return this.props.selections
  }

  map(fn) {
    this.idx = {}

    return this.props.selections.map((selection, index) => {
      this.idx[selection] = index

      return fn({
        selection,
        cache: this.props.cache,
        isDisabled: this.props.isDisabled,
        isLast: index === this.props.selections.length - 1,
        isVertical: this.isVertical,
        getAdjacent: this.getAdjacent,
        onContextMenu: this.props.onContextMenu
      })
    })
  }

  static propTypes = {
    selections: arrayOf(
      number
    ).isRequired,
    cache: string.isRequired,
    size: number.isRequired
  }
}

module.exports = {
  SelectionIterator
}
