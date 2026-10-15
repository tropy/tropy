import { useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { Form } from '../form.js'
import { Modal } from '../modal.js'
import { OCRSettings } from '../settings/ocr.js'
import { useEvent } from '../../hooks/use-event.js'

export const TranscriptionConfig = ({ config, onClose }) => {
  let [draft, setDraft] = useState(config)

  let handleChange = useEvent(({ ocr }) => {
    setDraft(prev => ({ ...prev, ...ocr }))
  })

  let handleClose = useEvent(({ cancel, value }) => {
    onClose(cancel ? { cancel } : { cancel, value, data: draft })
  })

  let handleCancel = useEvent((event) => {
    event.currentTarget.closest('dialog').requestClose()
  })

  return (
    <Modal className="transcription-config" onClose={handleClose}>
      <Form method="dialog" size={8}>
        <h1>
          <FormattedMessage id="transcription.config.title"/>
        </h1>
        <OCRSettings config={draft} onChange={handleChange}/>
        <footer>
          <button
            type="button"
            className="btn btn-default"
            onClick={handleCancel}>
            <FormattedMessage id="transcription.config.cancel"/>
          </button>
          <button
            className="btn btn-primary"
            autoFocus
            value="transcribe">
            <FormattedMessage id="transcription.config.submit"/>
          </button>
        </footer>
      </Form>
    </Modal>
  )
}
