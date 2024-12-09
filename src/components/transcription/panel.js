import { useDispatch, useSelector } from 'react-redux'
import { TranscriptionMetadata } from './metadata.js'
import { getTranscriptions } from '../../selectors/index.js'
import { activate } from '../../slices/transcriptions.js'
import cx from 'classnames'

export const TranscriptionPanel = ({
  active,
  id,
}) => {
  let dispatch = useDispatch()
  let transcriptions = useSelector(state => getTranscriptions(state, { id }))

  return (
    <div className="transcription-panel">
      <ol className="transcription-versions">
        {transcriptions.map(tr => (
          <li
            key={tr.id}
            className={cx({ active: tr.id === active })}>
            <TranscriptionMetadata
              created={tr.created}
              onMouseDown={() => dispatch(activate(tr.id))}/>
          </li>
        ))}
      </ol>
    </div>
  )
}
