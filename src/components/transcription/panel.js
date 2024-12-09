import { useDispatch, useSelector } from 'react-redux'
import { TranscriptionMetadata } from './metadata.js'
import { getTranscriptions } from '../../selectors/index.js'
import { activate } from '../../slices/transcriptions.js'

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
          <li key={tr.id}>
            <TranscriptionMetadata
              created={tr.created}
              isActive={tr.id === active}
              onMouseDown={() => dispatch(activate(tr.id))}/>
          </li>
        ))}
      </ol>
    </div>
  )
}
