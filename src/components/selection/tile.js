'use strict'

const React = require('react')
const { SelectionIterable } = require('./iterable')
const cx = require('classnames')


class SelectionTile extends SelectionIterable {
  get classes() {
    return {
      ...super.classes,
      tile: true
    }
  }

  render() {
    return (
      <li
        className={cx(this.classes)}
        ref={this.setContainer}>
        <div className="tile-state">
          {this.props.selection.id}
        </div>
      </li>
    )
  }
}

module.exports = {
  SelectionTile
}
