'use strict'

const React = require('react')
const { PureComponent } = React
const { Thumbnail } = require('./thumbnail')
const cx = require('classnames')
const { string, arrayOf, shape, number } = require('prop-types')


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
    const { cache, size } = this.props
    const { id, angle, mirror, orientation } = this.item

    return (
      <div className={cx(this.classes)}>
        <Thumbnail
          id={id}
          angle={angle}
          mirror={mirror}
          orientation={orientation}
          size={size}
          cache={cache}/>
        {this.count > 1 &&
          <div className="badge">{this.count}</div>
        }
      </div>
    )

  }

  static propTypes = {
    cache: string.isRequired,
    size: number.isRequired,
    items: arrayOf(shape({
      id: number.isRequired
    })).isRequired
  }

  static defaultProps = {
    size: 64
  }
}

module.exports = {
  PhotoDragPreview
}
