import { useSelector } from 'react-redux'
import { arrayOf, number } from 'prop-types'

export const EsperOverlay = ({ transcriptions }) => {
  let id = transcriptions.at(-1)
  let tr = useSelector(state => state.transcriptions[id])

  if (tr == null)
    return null

  if (tr.status < 0)
    return (
      <div className="esper-overlay">
        {tr.config?.error || 'Error'}
      </div>
    )

  return (
    <div className="esper-overlay">
      {tr.status === 0 ? 'Pending...' : tr.text}
    </div>
  )
}

EsperOverlay.propTypes = {
  transcriptions: arrayOf(number).isRequired
}
