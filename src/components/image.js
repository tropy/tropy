import { IconPhoto } from './icons.js'

export function Image ({ src, rotation = '0' }) {
  if (!src)
    return <IconPhoto/>
  else
    return (
      <div className={`rotation-container iiif rot-${rotation}`}>
        <img
          decoding="async"
          src={src}/>
      </div>
    )
}
