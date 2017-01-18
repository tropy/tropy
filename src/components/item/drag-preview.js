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
      'multiple': false
    }
  }

  render() {
    return (
      <div className={cn(this.classes)}>
        <CoverImage {...this.props} size={this.size}/>
      </div>
    )

  }

  static propTypes = {
    zoom: PropTypes.number.isRequired,
    cache: PropTypes.string.isRequired,
    item: PropTypes.shape({
      id: PropTypes.number.isRequired
    })
  }
}

module.exports = {
  ItemDragPreview
}

