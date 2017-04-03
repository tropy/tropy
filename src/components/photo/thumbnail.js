'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { IconPhoto } = require('../icons')
const { imageURL } = require('../../common/cache')
const { pick } = require('../../common/util')
const { string, number, func } = PropTypes
const { ICON } = require('../../constants/sass')


class Thumbnail extends PureComponent {
  get src() {
    const { cache, id, size } = this.props

    return (id != null) ?
      imageURL(cache, id, size > ICON.SIZE ? ICON.MAX : ICON.SIZE) : null
  }

  render() {
    const { src } = this
    const { orientation } = this.props

    const listeners = pick(this.props, [
      'onClick', 'onDoubleClick', 'onMouseDown', 'onContextMenu'
    ])

    return (
      <figure {...listeners} className="thumbnail">
        <IconPhoto/>
        {src &&
          <img className={`exif orientation-${orientation}`} src={src}/>}
      </figure>
    )
  }

  static propTypes = {
    cache: string.isRequired,
    id: number,
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
