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
        tagName="div"
        values={{ name }}/>
      <FormattedDate
        dateStyle="medium"
        timeStyle="short"
        tagName="div"
        value={created}/>
    </div>
  )
}
