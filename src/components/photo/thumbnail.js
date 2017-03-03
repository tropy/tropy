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

    const listeners = pick(this.props, [
      'onClick', 'onDoubleClick', 'onMouseDown', 'onContextMenu'
    ])

    return (
      <figure {...listeners} className="thumbnail">
        <IconPhoto/>
        {src && <img src={src}/>}
      </figure>
    )
  }

  static propTypes = {
    cache: string.isRequired,
    id: number,
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
