import { FormattedDate, FormattedTime } from 'react-intl'
import cn from 'classnames'


export const TranscriptionMetadata = ({
  isActive,
  created
}) => {

  return (
    <div className={cn('transcription-metadata', {
      active: isActive
    })}>
      <FormattedDate value={created}/>
      <FormattedTime value={created}/>
    </div>
  )
}
