import { memo } from 'react'
import { useSelector } from 'react-redux'
import cx from 'classnames'
import { Icon } from '../icons.js'

export const TranscriptionIcon = memo(({
  id
}) => {
  let transcription = useSelector(state => state.transcriptions[id])

  if (transcription == null)
    return null

  if (transcription.status < 0)
    return (
      <Icon name="TranscriptionFailed"/>
    )

  return (
    <Icon
      name="Transcription"
      className={cx({
        pending: transcription.status === 0
      })}/>
  )
})
