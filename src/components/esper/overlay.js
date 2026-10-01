import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cx from 'classnames'
import { useEvent } from '../../hooks/use-event.js'
import { Resizable } from '../resizable.js'
import { Titlebar, Toolbar } from '../toolbar.js'
import { FontSize, Layout } from './tools.js'
import { ESPER, ITEM, SASS } from '../../constants/index.js'
import ui from '../../actions/ui.js'

const { MIN_WIDTH, MIN_HEIGHT } = SASS.ESPER

export const EsperOverlay = ({
  children,
  isDisabled,
  mode,
  panel
}) => {
  let dispatch = useDispatch()
  let height = useSelector(state => state.ui.esper.split)
  let fontSize = useSelector(state => state.ui.esper.fontSize)
  let isPanelVisible = useSelector(state => state.ui.esper.overlayPanel)
  let layout = useSelector(state => state.settings.layout)

  let isSideBySide = layout === ITEM.LAYOUT.SIDE_BY_SIDE
  let isSplit = mode === ESPER.OVERLAY.SPLIT

  let handleChange = useEvent((esper) => {
    dispatch(ui.update({ esper }))
  })

  let handleResize = useEvent((split) => {
    handleChange({ split })
  })

  let handleFontSizeChange = useEvent((fontSize) => {
    handleChange({ fontSize })
  })

  let [edge, min] = isSideBySide ?
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
      <div
        className={cx('esper-overlay', mode, {
          'transcription-panel-visible': isPanelVisible
        })}
        style={{ '--font-size': `${fontSize}px` }}>
        {React.createElement(isSideBySide || !isSplit ? Titlebar : Toolbar, {},
          <Toolbar.Left>
            <FontSize
              current={fontSize}
              isDisabled={isDisabled}
              onChange={handleFontSizeChange}/>
          </Toolbar.Left>,
          <Toolbar.Right>
            <Layout
              isAltLayout={!isSideBySide && isSplit}
              isDisabled={isDisabled}
              onChange={handleChange}
              overlay={mode}
              overlayPanel={isPanelVisible}/>
          </Toolbar.Right>)}
        {children}
        {panel}
      </div>
    </Resizable>
  )
}
