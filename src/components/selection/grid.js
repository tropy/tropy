'use strict'

const React = require('react')
const { SelectionIterator } = require('./iterator')
const { SelectionTile } = require('./tile')
const cx = require('classnames')


class SelectionGrid extends SelectionIterator {
  get classes() {
    return {
      ...super.classes,
      grid: true
    }
  }

  render() {
    return (
      <ul className={cx(this.classes)}>
        {this.map(({ selection, ...props }) =>
          <SelectionTile {...props}
            key={selection.id}
            isSelected={false}
            selection={selection}/>)}
      </ul>
    )
  }

  static propTypes = {
    ...SelectionIterator.propTypes
  }

  static get isGrid() {
    return true
  }
}

module.exports = {
  SelectionGrid
}
