'use strict'

const React = require('react')
const { ItemIterable } = require('./iterable')
const { CoverImage } = require('./cover-image')
const cn = require('classnames')
const { string } = React.PropTypes


class ItemTile extends ItemIterable {

  get classes() {
    return {
      ...super.classes, tile: true
    }
  }

  get style() {
    const height = `${this.props.size * 1.25}px`
    return { height, flexBasis: height }
  }

  render() {
    return this.connect(
      <li className={cn(this.classes)} style={this.style}>
        <CoverImage {...this.props}
          onClick={this.handleSelect}
          onContextMenu={this.handleContextMenu}
          onDoubleClick={this.handleOpen}/>
      </li>
    )
  }

  static propTypes = {
    ...ItemIterable.propTypes,
    cache: string.isRequired
  }
}

module.exports = {
  ItemTile: ItemTile.wrap()
}
