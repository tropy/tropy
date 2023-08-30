import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PictureInPicture } from '../pip.js'
import nav from '../../actions/nav.js'

export function ItemQuickView() {
  let dispatch = useDispatch()

  let isVisible = useSelector(state => state.nav.quickview)
  let item = useSelector(state => state.nav.items?.[0])

  let handleHide = useCallback(() => {
    dispatch(nav.update({ quickview: false }))
  }, [dispatch])

  return (
    <PictureInPicture
      isVisible={isVisible}
      onHide={handleHide}
      width={640}
      height={320}>
      <div className="item-preview">
        <h1>{item}</h1>
      </div>
    </PictureInPicture>
  )
}
