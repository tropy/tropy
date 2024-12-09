import { FormattedDate, FormattedMessage } from 'react-intl'
import cn from 'classnames'


export const TranscriptionMetadata = ({
  isActive,
  created,
  name,
  onMouseDown
}) => {

  return (
    <div
      className={cn('transcription-metadata', {
        active: isActive
      })}
      onMouseDown={onMouseDown}
      tabIndex="-1">
      <FormattedMessage
        id="transcription.title"
        tagName="div"
        values={{ name }}/>
      <div>
        <FormattedDate
          dateStyle="medium"
          timeStyle="short"
          value={created}/>
      </div>
    </div>
  )
}
