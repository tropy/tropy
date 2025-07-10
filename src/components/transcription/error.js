import { useDispatch } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { Button } from '../button.js'
import { Icon } from '../icons.js'
import { create } from '../../slices/transcriptions.js'

export const TranscriptionError = ({ config }) => {
  let dispatch = useDispatch()

  return (
    <div className="error">
      <Icon name="TranscriptionFailedExtraLarge"/>
      <FormattedMessage id="transcription.error" tagName="p"/>
      <Button
        isDefault
        onClick={() => dispatch(create({ config }))}
        text="transcription.retry" />
    </div>
  )
}
