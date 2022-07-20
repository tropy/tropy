import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { bool, func, number, string } from 'prop-types'
import { Image } from '../image.js'
import { getCachePrefix } from '../../selectors/project.js'
import { Cache } from '../../common/cache.js'
import { SASS } from '../../constants/index.js'
import { Rotation } from '../../common/iiif.js'
import act from '../../actions/photo.js'

const variant = (size) =>
  size > SASS.ICON.SIZE ? SASS.ICON.MAX : SASS.ICON.SIZE

export function Thumbnail(props) {
  let dispatch = useDispatch()
  let cache = useSelector(getCachePrefix)

  let src = Cache.url(cache, variant(props.size), props)
  let rot = Rotation.fromExifOrientation(props.orientation).add(props)
  let [x, y] = rot.ratio(props)
  let rotation = rot.format('x')

  let style = {
    '--x': x,
    '--y': y,
    'backgroundColor': props.color
  }

  let handleError = () => {
    if (!props.broken) {
      dispatch(act.error(props.id))
    }
  }

  return (
    <figure
      className="thumbnail"
      style={style}
      onClick={props.onClick}
      onContextMenu={props.onContextMenu}
      onDoubleClick={props.onDoubleClick}
      onMouseDown={props.onMouseDown}>
      <Image
        src={src}
        rotation={rotation}
        onError={handleError}/>
    </figure>
  )
}

Thumbnail.propTypes = {
  angle: number,
  broken: bool,
  color: string,
  consolidated: number,
  height: number,
  id: number,
  mimetype: string,
  mirror: bool,
  orientation: number,
  size: number.isRequired,
  width: number,
  onClick: func,
  onContextMenu: func,
  onDoubleClick: func,
  onMouseDown: func
}

Thumbnail.defaultProps = {
  size: SASS.ICON.SIZE
}

Thumbnail.keys = Object.keys(Thumbnail.propTypes)
