'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { CoverImage } = require('./cover-image')
const { ItemGrid } = require('./grid')
const cn = require('classnames')

class ItemDragPreview extends Component {

  get size() {
    return ItemGrid.ZOOM[this.props.zoom]
  }

  get classes() {
    return {
      'item-drag-preview': true,
      'multiple': this.count > 1
    }
  }

  get item() {
    return this.props.items[0]
  }

  get count() {
    return this.props.items.length
  }

  render() {
    return (
      <div className={cn(this.classes)}>
        <CoverImage {...this.props} item={this.item} size={this.size}/>
        {this.count > 1 &&
          <div className="count">{this.count}</div>
        }
      </div>
    )

  }

  static propTypes = {
    zoom: PropTypes.number.isRequired,
    cache: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired
    })).isRequired
  }
}

module.exports = {
  ItemDragPreview
}
