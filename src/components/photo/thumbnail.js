'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { IconPhoto } = require('../icons')
const { imageURL } = require('../../common/cache')
const { pick } = require('../../common/util')
const { string, number, func } = PropTypes


class Thumbnail extends PureComponent {

  get src() {
    const { cache, id, size } = this.props

    return (id != null) ?
      imageURL(cache, id, size > 48 ? 512 : 48) : null
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
    size: 48
  }
}


module.exports = {
  Thumbnail
}
