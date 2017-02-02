'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { CoverImage } = require('./cover-image')
const cn = require('classnames')

class ItemDragPreview extends Component {

  get classes() {
    return {
      'item': true,
      'drag-preview': true,
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
        <CoverImage {...this.props} item={this.item}/>
        {this.count > 1 &&
          <div className="badge">{this.count}</div>
        }
      </div>
    )

  }

  static propTypes = {
    size: PropTypes.number,
    cache: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired
    })).isRequired
  }

  static defaultProps = {
    size: 64
  }
}

module.exports = {
  ItemDragPreview
}
