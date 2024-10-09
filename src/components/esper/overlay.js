import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { useEvent } from '../../hooks/use-event.js'
import { Resizable } from '../resizable.js'
import { ESPER, ITEM, SASS } from '../../constants/index.js'
import ui from '../../actions/ui.js'

const { MIN_WIDTH, MIN_HEIGHT } = SASS.ESPER

export const EsperOverlay = ({ children, mode }) => {
  let dispatch = useDispatch()
  let height = useSelector(state => state.ui.esper.split)
  let layout = useSelector(state => state.settings.layout)

  let handleResize = useEvent((split) => {
    dispatch(ui.update({ esper: { split } }))
  })

  let [edge, min] = (layout === ITEM.LAYOUT.SIDE_BY_SIDE) ?
      ['left', MIN_WIDTH] : ['top', MIN_HEIGHT]

  return (
    <Resizable
      edge={edge}
      margin={min}
      min={min}
      isRelative
      isBuffered
      onChange={handleResize}
      skip={mode === ESPER.OVERLAY.FULL}
      value={height}>
      <div className={cx('esper-overlay', mode)}>
        {children}
      </div>
    </Resizable>
  )
}
