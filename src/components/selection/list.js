'use strict'

const React = require('react')
const { SelectionIterator } = require('./iterator')
const { SelectionListItem } = require('./list-item')


class SelectionList extends SelectionIterator {

  render() {
    return (
      <ul className="selection list">
        {this.map(({ selection, ...props }) =>
          <SelectionListItem {...props}
            key={selection.id}
            isSelected={false}
            selection={selection}/>)}
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
