import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { useEvent } from '../../hooks/use-event.js'
import { Resizable } from '../resizable.js'
import { ESPER, ITEM } from '../../constants/index.js'
import ui from '../../actions/ui.js'

export const EsperOverlay = ({ children, mode }) => {
  let dispatch = useDispatch()
  let height = useSelector(state => state.ui.esper.split)
  let layout = useSelector(state => state.settings.layout)

  let handleResize = useEvent((split) => {
    dispatch(ui.update({ esper: { split } }))
  })

  let overlay = (
    <div className={cx('esper-overlay', mode)}>
      {children}
    </div>
  )

  if (mode === ESPER.OVERLAY.FULL)
    return overlay

  return (
    <Resizable
      edge={layout === ITEM.LAYOUT.SIDE_BY_SIDE ? 'left' : 'top'}
      isRelative
      isBuffered
      onChange={handleResize}
      value={height}>
      {overlay}
    </Resizable>
  )
}
