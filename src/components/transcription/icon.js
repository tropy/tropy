import { useSelector } from 'react-redux'
import cx from 'classnames'
import { Icon } from '../icons.js'

export const TranscriptionIcon = ({
  id
}) => {
  let status = useSelector(state =>
    state.transcriptions[id]?.status)

  if (status == null)
    return null

  if (status < 0)
    return (
      <Icon name="TranscriptionFailed"/>
    )

  return (
    <Icon
      name="Transcription"
      className={cx({
        pending: status === 0
      })}/>
  )
}
