import { createContext, use, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Image } from '../image.js'
import { selectCachePrefix } from '../../selectors/project.js'
import { Cache } from '../../common/cache.js'
import { SASS } from '../../constants/index.js'
import { Rotation } from '../../common/iiif.js'
import act from '../../actions/photo.js'

const variant = (size) =>
  size > SASS.ICON.SIZE ? SASS.ICON.MAX : SASS.ICON.SIZE

const CacheContext = createContext(null)

export function ThumbnailProvider ({ children }) {
  let dispatch = useDispatch()
  let cache = useSelector(selectCachePrefix)

  useEffect(() => {
    let handleError = (event) => {
      if (event.target.tagName !== 'IMG') return

      let id = event.target.closest('.thumbnail')?.dataset.id
      if (id) dispatch(act.error(Number(id)))
    }

    document.addEventListener('error', handleError, true)
    return () => {
      document.removeEventListener('error', handleError, true)
    }
  }, [dispatch])

  return (
    <CacheContext value={cache}>
      {children}
    </CacheContext>
  )
}

// data-id: the image's load errors are reported (not if broken).
export function Thumbnail ({
  size = SASS.ICON.SIZE,
  ...props
}) {
  let cache = use(CacheContext)

  let src = Cache.url(cache, variant(size), props)
  let rot = Rotation.fromExifOrientation(props.orientation).add(props)
  let [x, y] = rot.ratio(props)
  let rotation = rot.format('x')

  let style = {
    '--x': x,
    '--y': y,
    backgroundColor: props.color
  }

  return (
    <figure
      className="thumbnail"
      data-id={props.broken ? null : props.id}
      style={style}
      onClick={props.onClick}
      onContextMenu={props.onContextMenu}
      onDoubleClick={props.onDoubleClick}
      onMouseDown={props.onMouseDown}>
      <Image src={src} rotation={rotation}/>
    </figure>
  )
}

Thumbnail.keys = [
  'angle',
  'broken',
  'color',
  'consolidated',
  'height',
  'id',
  'mimetype',
  'mirror',
  'orientation',
  'size',
  'width'
]
