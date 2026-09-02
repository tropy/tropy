import { useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { Alto } from './alto.js'
import { TranscriptionError } from './error.js'
import { Icon } from '../icons.js'
import { ScrollContainer } from '../scroll/index.js'
import { useEvent } from '../../hooks/use-event.js'
import esper from '../../actions/esper.js'


const useScrollOffset = (container, id) => {
  let dispatch = useDispatch()
  let saved = useSelector(state => state.esper.text[id]?.scroll)

  let offset = useRef(saved)

  useLayoutEffect(() => {
    if (offset.current != null)
      container.current.scroll(offset.current.top, offset.current.left)
  }, [container])

  return useEvent(() => {
    let { scrollTop: top, scrollLeft: left } = container.current

    if (top === offset.current?.top && left === offset.current?.left)
      return

    offset.current = { top, left }
    dispatch(esper.update({ text: { [id]: { scroll: offset.current } } }))
  })
}


export const Transcription = ({
  config,
  data,
  id,
  onSelect,
  selection,
  status = 0,
  tabIndex = -1,
  text
}) => {
  let container = useRef()
  let handleScrollStop = useScrollOffset(container, id)

  let content

  if (status < 0) {
    content = (
      <TranscriptionError config={config}/>
    )

  } else if (status === 0) {
    content = (
      <div className="pending">
        <Icon name="TranscriptionExtraLarge"/>
        <FormattedMessage id="transcription.pending" tagName="p"/>
      </div>
    )

  } else if (data) {
    content = (
      <Alto
        document={data}
        onSelect={onSelect}
        selection={selection}/>
    )

  } else {
    content = (
      <pre>{text}</pre>
    )
  }

  return (
    <ScrollContainer
      ref={container}
      className="transcription"
      onScrollStop={handleScrollStop}
      tabIndex={tabIndex}>
      {content}
    </ScrollContainer>
  )
}
