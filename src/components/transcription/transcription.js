import { useCallback, useLayoutEffect, useRef } from 'react'
import { FormattedMessage } from 'react-intl'
import { Alto } from './alto.js'
import { TranscriptionError } from './error.js'
import { Icon } from '../icons.js'
import { bounds } from '../../dom.js'

const isVisible = (rect, box) => (
  rect.top >= box.top && rect.bottom <= box.bottom
)


export const Transcription = ({
  config,
  data,
  onSelect,
  selection,
  status = 0,
  tabIndex = -1,
  text
}) => {
  let container = useRef()
  let batch = useRef([])

  let handleSelected = useCallback((node) => {
    batch.current.push(node)
  }, [])

  useLayoutEffect(() => {
    // LayoutEffect fires after selection update,
    // so batch.current is all newly selected strings in latest render!
    let added = batch.current
    batch.current = []

    if (!added.length)
      return

    let box = bounds(container.current)
    let first = bounds(added[0])
    let last = added.length > 1 ? bounds(added.at(-1)) : first

    if (isVisible(first, box) || isVisible(last, box))
      return

    let isAbove = first.bottom <= box.top

    // Selection grew in both directions, as in select all: stay put!
    if (isAbove !== (last.bottom <= box.top))
      return

    added.at(isAbove ? 0 : -1).scrollIntoView({ block: 'nearest' })
  }, [selection])

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
        onSelected={handleSelected}
        selection={selection}/>
    )

  } else {
    content = (
      <pre>{text}</pre>
    )
  }

  return (
    <div className="transcription" ref={container} tabIndex={tabIndex}>
      {content}
    </div>
  )
}
