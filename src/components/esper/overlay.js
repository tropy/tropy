import { useDispatch, useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { Resizable } from '../resizable.js'
import { ESPER } from '../../constants/index.js'
import ui from '../../actions/ui.js'


const Transcription = ({ status, config, text }) => (
  (status < 0) ? (
    <span className="error">{config?.error || 'Error'}</span>
  ) : (
    <pre>
      {status === 0 ? 'Pending...' : text}
    </pre>
  )
)

export const EsperOverlay = ({ mode, transcriptions }) => {
  let dispatch = useDispatch()
  let id = transcriptions.at(-1)
  let tr = useSelector(state => state.transcriptions[id])

  let height = useSelector(state => state.ui.esper.split)

  let handleResize = useEvent((split) => {
    dispatch(ui.update({ esper: { split } }))
  })


  if (tr == null)
    return null

  let overlay = (
    <div className="esper-overlay">
      <Transcription
        config={tr.config}
        status={tr.status}
        text={tr.text}/>
    </div>
  )

  if (mode === ESPER.OVERLAY.FULL)
    return overlay

  return (
    <Resizable
      edge="top"
      isRelative
      isBuffered
      onChange={handleResize}
      value={height}>
      {overlay}
    </Resizable>
  )
}
