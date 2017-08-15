'use strict'


const React = require('react')
const { SelectionIterable } = require('./iterable')
const cx = require('classnames')


class SelectionListItem extends SelectionIterable {

  render() {
    return (
      <li
        className={cx(this.classes)}
        ref={this.setContainer}>
        <div>{this.props.selection.id}</div>
      </li>
    )
  }
}

module.exports = {
  SelectionListItem
}
