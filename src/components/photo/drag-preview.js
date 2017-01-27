'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { Thumbnail } = require('./thumbnail')
const cn = require('classnames')

class PhotoDragPreview extends Component {

  get classes() {
    return {
      'photo-drag-preview': true,
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
        <Thumbnail {...this.props} photo={this.item} size={64}/>
        {this.count > 1 &&
          <div className="badge">{this.count}</div>
        }
      </div>
    )

  }

  static propTypes = {
    cache: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired
    })).isRequired
  }
}

module.exports = {
  PhotoDragPreview
}
