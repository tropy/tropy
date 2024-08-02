import { IconPhoto } from './icons.js'

export function Image({ onError, src, rotation = '0' }) {
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
