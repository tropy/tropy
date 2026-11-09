import { useDispatch, useStore } from 'react-redux'
import { useWindow } from '../../hooks/use-window.js'
import { indexOf } from '../../common/sequence.js'
import { getVisiblePhotos } from '../../selectors/index.js'
import * as act from '../../actions/index.js'

export function usePhotoPreview () {
  let { quicklook } = useWindow()
  let dispatch = useDispatch()

  // Use store so we only re-render when invoked!
  let store = useStore()

  let cycle = (by = 1) => {
    let state = store.getState()
    let photos = getVisiblePhotos(state)
    let current = state.nav.photo

    let idx = indexOf(photos, current)
    if (idx < 0) idx = (by > 0) ? -1 : 0

    let photo = photos[(idx + by + photos.length) % photos.length]

    if (photo != null && photo.id !== current)
      dispatch(act.photo.select({ photo: photo.id, item: photo.item }))
  }

  return (by) => {
    if (quicklook.isVisible)
      cycle(by)
    else
      quicklook.show()
  }
}
