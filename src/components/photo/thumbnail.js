'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { IconPhoto } = require('../icons')
const { imageURL } = require('../../common/cache')
const { pick } = require('../../common/util')
const { string, number, func } = PropTypes

const SIZE = 512

class Thumbnail extends PureComponent {

  get src() {
    const { cache, id } = this.props

    return (id != null) ?
      imageURL(cache, id, SIZE > 48 ? 512 : 48) : null
  }

  render() {
    const { src } = this

    const listeners = pick(this.props, [
      'onClick', 'onDoubleClick', 'onMouseDown', 'onContextMenu'
    ])

    return (
      <figure {...listeners} className="thumbnail">
        <IconPhoto/>
        {src && <img src={encodeURI(src)}/>}
      </figure>
    )
  }

  static propTypes = {
    cache: string.isRequired,
    id: number,
    onClick: func,
    onContextMenu: func,
    onDoubleClick: func,
    onMouseDown: func
  }
}


module.exports = {
  Thumbnail
}
