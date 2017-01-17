'use strict'

const React = require('react')
const { Component, PropTypes } = React
//const { CoverImage } = require('./cover-image')
const cn = require('classnames')


class ItemDragPreview extends Component {

  get style() {
    return {}
  }

  get classes() {
    return {
      'item-drag-preview': true,
      'multiple': false
    }
  }

  render() {
    return (
      <div
        className={cn(this.classes)}
        style={this.style}>
        {this.props.item.id}
      </div>
    )

    //<CoverImage {...this.props}/>
  }

  static propTypes = {
    //size: PropTypes.number.isRequired,
    //cache: PropTypes.string.isRequired,
    item: PropTypes.shape({
      id: PropTypes.number.isRequired
    })
  }
}

module.exports = {
  ItemDragPreview
}

