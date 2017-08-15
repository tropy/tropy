'use strict'

const React = require('react')
const { SelectionIterator } = require('./iterator')


class SelectionList extends SelectionIterator {

  render() {
    return (
      <ul className="selection list">
        {this.map(({ selection }) =>
          <div key={selection}>{selection}</div>)}
      </ul>
    )
  }

  static propTypes = {
    ...SelectionIterator.propTypes
  }
}

module.exports = {
  SelectionList
}
