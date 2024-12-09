import { FormattedDate, FormattedMessage } from 'react-intl'

export const TranscriptionMetadata = ({
  created,
  name,
  onMouseDown
}) => {

  return (
    <div
      className="transcription-metadata"
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
