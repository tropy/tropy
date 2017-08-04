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

  render() {
    const { src, rotation } = this

    const listeners = pick(this.props, [
      'onClick', 'onDoubleClick', 'onMouseDown', 'onContextMenu'
    ])

    return (
      <figure {...listeners} className="thumbnail">
        <IconPhoto/>
        {src &&
          <img className={`iiif rot-${rotation}`} src={src}/>}
      </figure>
    )
  }

  static propTypes = {
    cache: string.isRequired,
    id: number,
    angle: number,
    mirror: bool,
    orientation: number,
    size: number.isRequired,
    onClick: func,
    onContextMenu: func,
    onDoubleClick: func,
    onMouseDown: func
  }

  static defaultProps = {
    size: ICON.SIZE
  }
}


module.exports = {
  Thumbnail
}
