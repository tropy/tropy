'use strict'

const React = require('react')
const { PureComponent } = React
const { IconPhoto } = require('../icons')
const { imageURL } = require('../../common/cache')
const { pick } = require('../../common/util')
const { bool, func, number, string } = require('prop-types')
const { ICON } = require('../../constants/sass')
const { Rotation } = require('../../common/iiif')


class Thumbnail extends PureComponent {
  get src() {
    const { cache, id, size } = this.props

    return (id != null) ?
      imageURL(cache, id, size > ICON.SIZE ? ICON.MAX : ICON.SIZE) : null
  }

  get rotation() {
    return Rotation
      .fromExifOrientation(this.props.orientation)
      .add(this.props)
      .format('x')
  }

  handleError = () => {
    if (this.props.onError != null) {
      this.props.onError(this.props.id)
    }
  }

  renderImage() {
    const { src, rotation } = this
    return src && (
      <img
        className={`iiif rot-${rotation}`}
        src={src}
        onError={this.handleError}/>
    )
  }

  render() {
    const listeners = pick(this.props, [
      'onClick', 'onDoubleClick', 'onMouseDown', 'onContextMenu'
    ])

    return (
      <figure {...listeners} className="thumbnail">
        <IconPhoto/>
        {this.renderImage()}
      </figure>
    )
  }

  static propTypes = {
    angle: number,
    cache: string.isRequired,
    id: number,
    mirror: bool,
    orientation: number,
    size: number.isRequired,
    onClick: func,
    onContextMenu: func,
    onDoubleClick: func,
    onError: func,
    onMouseDown: func
  }

  static defaultProps = {
    size: ICON.SIZE
  }
}


module.exports = {
  Thumbnail
}
