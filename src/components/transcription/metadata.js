import { FormattedDate, FormattedMessage } from 'react-intl'
import cn from 'classnames'


export const TranscriptionMetadata = ({
  isActive,
  created,
  name,
  onClick
}) => {

  return (
    <div
      className={cn('transcription-metadata', {
        active: isActive
      })}
      onClick={onClick}
      tabIndex="-1">
      <FormattedMessage
        id="transcription.title"
        values={{ name }}/>
      <FormattedDate
        dateStyle="medium"
        timeStyle="short"
        value={created}/>
    </div>
  )
}
