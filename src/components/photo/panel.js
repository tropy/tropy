import { PhotoGrid } from './grid.js'
import { PhotoList } from './list.js'
import { SASS } from '../../constants/index.js'

// The photo list or grid, depending on the zoom level.
// Both select their state and dispatch their actions themselves.
export const PhotoPanel = ({ zoom, ...props }) => {
  let PhotoIterator = (zoom > 0) ? PhotoGrid : PhotoList

  return (
    <PhotoIterator {...props} size={SASS.PHOTO.ZOOM[zoom]}/>
  )
}
