'use strict'

const React = require('react')
const { SelectionIterator } = require('./iterator')
const { SelectionTile } = require('./tile')
const cx = require('classnames')


class SelectionGrid extends SelectionIterator {
  static get isGrid() { return true }

  get classes() {
    return {
      ...super.classes,
      grid: true
    }
  }

  render() {
    return this.connect(
      <ul className={cx(this.classes)} ref={this.setContainer}>
        {this.map(({ selection, ...props }) =>
          <SelectionTile {...props}
            key={selection.id}
            isSelected={false}
            onContextMenu={this.props.onContextMenu}
            selection={selection}/>)}
        {this.filler}
      </ul>
    )
  }

  static propTypes = {
    ...SelectionIterator.propTypes
  }
}

module.exports = {
  SelectionGrid: SelectionGrid.asDropTarget()
}
