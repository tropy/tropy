import { object } from 'prop-types'

export const EsperOverlay = ({ transcription }) => {
  if (transcription == null)
    return null

  if (transcription.status < 0)
    return (
      <div className="esper-overlay">
        {transcription.config?.error || 'Error'}
      </div>
    )

  return (
    <div className="esper-overlay">
      <pre>
        {transcription.status === 0 ? 'Pending...' : transcription.text}
      </pre>
    </div>
  )
}

EsperOverlay.propTypes = {
  transcription: object
}
