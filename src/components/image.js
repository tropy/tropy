import { func, string } from 'prop-types'
import { IconPhoto } from './icons.js'

export function Image({ onError, src, rotation }) {
  if (!src)
    return <IconPhoto/>
  else
    return (
      <div className={`rotation-container iiif rot-${rotation}`}>
        <img
          decoding="async"
          loading="lazy"
          src={src}
          onError={onError}/>
      </div>
    )
}

Image.propTypes = {
  onError: func,
  rotation: string.isRequired,
  src: string
}

Image.defaultProps = {
  rotation: '0'
}
