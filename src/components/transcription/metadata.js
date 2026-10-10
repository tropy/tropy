import { FormattedDate, FormattedMessage } from 'react-intl'

export const TranscriptionMetadata = ({
  created,
  name
}) => {

  return (
    <div className="transcription-metadata">
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
