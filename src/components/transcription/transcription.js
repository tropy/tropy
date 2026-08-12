import { useCallback, useLayoutEffect, useRef } from 'react'
import { FormattedMessage } from 'react-intl'
import { Alto } from './alto.js'
import { TranscriptionError } from './error.js'
import { Icon } from '../icons.js'


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

    let box = container.current.getBoundingClientRect()
    let above = null
    let below = null

    for (let node of added) {
      let { top, bottom } = node.getBoundingClientRect()

      if (top < box.bottom && bottom > box.top)
        return

      if (bottom <= box.top)
        above ??= node
      else
        below = node
    }

    // Selection grew in both directions, as in select all: stay put!
    if (above && below)
      return

    (above ?? below).scrollIntoView({ block: 'nearest' })
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
