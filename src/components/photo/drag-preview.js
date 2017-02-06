'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { Thumbnail } = require('./thumbnail')
const cn = require('classnames')

class PhotoDragPreview extends PureComponent {

  get classes() {
    return {
      'photo': true,
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
        <Thumbnail {...this.props} id={this.item.id}/>
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
  PhotoDragPreview
}
