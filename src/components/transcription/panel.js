import { useRef } from 'react'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { TranscriptionMetadata } from './metadata.js'
import { useCursorKeys } from '../../hooks/use-cursor-keys.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { useEvent } from '../../hooks/use-event.js'
import { useScrollIntoView } from '../../hooks/use-scroll-into-view.js'
import { useSequenceClicks } from '../../hooks/use-sequence-clicks.js'
import { Cursor } from '../../common/sequence.js'
import { getTranscriptions } from '../../selectors/index.js'
import { activate, remove } from '../../slices/transcriptions.js'
import * as act from '../../actions/index.js'
import cx from 'classnames'

export const TranscriptionPanel = ({
  active,
  id,
  isDisabled
}) => {
  let dispatch = useDispatch()
  let transcriptions = useSelector(
    state => getTranscriptions(state, { id }),
    shallowEqual)
  let cursor = new Cursor(transcriptions, active)

  let handleActivate = useEvent((tr) => {
    if (tr.id !== active)
      dispatch(activate(tr.id))
  })

  let handleDelete = useEvent(() => {
    if (cursor.current() == null)
      return false

    dispatch(remove([cursor.id], { history: 'add' }))
  })

  let handleContextMenu = (event, tr) => {
    event.stopPropagation()
    dispatch(act.context.show(event, 'transcription', {
      id: tr.id,
      hasAlto: !!tr.data,
      isReadOnly: isDisabled
    }))
  }

  let onKeyDown = useCursorKeys(cursor, {
    onMove: handleActivate,
    onKeyDown: useKeyMap('TranscriptionPanel', {
      delete: !isDisabled && handleDelete
    })
  })

  return (
    <div
      className="transcription-panel"
      tabIndex={-1}
      onKeyDown={onKeyDown}>
      <ol className="transcription-versions">
        {transcriptions.map(tr => (
          <TranscriptionVersion
            key={tr.id}
            isActive={tr.id === active}
            onActivate={handleActivate}
            onContextMenu={handleContextMenu}
            transcription={tr}/>
        ))}
      </ol>
    </div>
  )
}

const TranscriptionVersion = ({
  isActive,
  onActivate,
  onContextMenu,
  transcription
}) => {
  let dom = useRef()

  useScrollIntoView(dom, { when: isActive })

  let sequenceClicks = useSequenceClicks({
    isSelected: isActive,
    onSelect: onActivate,
    value: transcription
  })

  return (
    <li
      ref={dom}
      className={cx('version', { active: isActive })}
      onContextMenu={(event) => onContextMenu(event, transcription)}
      {...sequenceClicks}>
      <TranscriptionMetadata created={transcription.created}/>
    </li>
  )
}
