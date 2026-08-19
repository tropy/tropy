import { useLayoutEffect, useRef } from 'react'
import { FormattedMessage } from 'react-intl'
import { Alto } from './alto.js'
import { TranscriptionError } from './error.js'
import { Icon } from '../icons.js'
import { growingEdge } from '../../selection.js'


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
  let previous = useRef()

  // Follows the growing edge of the selection: the selected strings are
  // marked in the DOM already, so the first and last of them is all we
  // need. Scrolling into view is a no-op while they are visible.
  useLayoutEffect(() => {
    let nodes = container.current.querySelectorAll('.string.selected')
    let head = nodes[0]
    let tail = nodes[nodes.length - 1]

    let range = (head == null) ? [] :
      [Number(head.dataset.idx), Number(tail.dataset.idx)]

    let edge = growingEdge(range, previous.current)
    previous.current = range

    if (edge === 0)
      return

    let node = (edge < 0) ? head : tail
    node.scrollIntoView({ block: 'nearest' })
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
