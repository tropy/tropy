import { FormattedMessage } from 'react-intl'

export const Transcription = ({ idx, text }) => (
  <div className="transcription-container">
    <label>
      <FormattedMessage id="print.transcription" values={{ idx }}/>
    </label>
    <div className="transcription">{text}</div>
  </div>
)

export const TranscriptionList = ({ transcriptions, heading }) =>
  transcriptions.length === 0 ? null : (
    <div className="transcription-list">
      {heading && (
        <h5 className="transcriptions-heading">
          <FormattedMessage id={heading}/>
        </h5>
      )}
      {transcriptions.map((tr, idx) => (
        <Transcription
          key={tr.id}
          idx={idx + 1}
          text={tr.text}/>
      ))}
    </div>
  )
