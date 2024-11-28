import { FormattedDate, FormattedTime } from 'react-intl'
import cn from 'classnames'


export const TranscriptionMetadata = ({
  isActive,
  created,
  onClick
}) => {

  return (
    <div
      className={cn('transcription-metadata', {
        active: isActive
      })}
      onClick={onClick}>
      <FormattedDate value={created}/>
      <FormattedTime value={created}/>
    </div>
  )
}
