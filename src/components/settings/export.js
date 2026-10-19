import { FormElement, FormToggleGroup, Toggle } from '../form.js'
import { useEvent } from '../../hooks/use-event.js'

export function ExportSettings ({
  config,
  noteFormats = ['text', 'markdown', 'html'],
  transcriptionFormats = ['text', 'alto'],
  onChange
}) {
  let handleNoteFormatChange = useEvent((format) => {
    onChange({ export: { note: { format } } })
  })

  let handleNoteChange = useEvent((note) => {
    onChange({ export: { note } })
  })

  let handleTranscriptionFormatChange = useEvent((format) => {
    onChange({ export: { transcription: { format } } })
  })

  let handleTranscriptionChange = useEvent((transcription) => {
    onChange({ export: { transcription } })
  })

  return (
    <>
      <FormElement
        id="prefs.app.export.label"
        isCompact>
        <Toggle
          id="prefs.app.export.note.format.html"
          name="html"
          value={config.note.format.html}
          onChange={handleNoteFormatChange}/>
        <Toggle
          id="prefs.app.export.note.format.markdown"
          name="markdown"
          value={config.note.format.markdown}
          onChange={handleNoteFormatChange}/>
        <Toggle
          id="prefs.app.export.transcription.format.alto"
          name="alto"
          value={config.transcription.format.alto}
          onChange={handleTranscriptionFormatChange}/>
      </FormElement>
      <FormToggleGroup
        id="prefs.app.export.note.copy"
        name="copyFormat"
        isCompact
        value={config.note.copyFormat}
        options={noteFormats}
        onChange={handleNoteChange}/>
      <FormToggleGroup
        id="prefs.app.export.transcription.copy"
        name="copyFormat"
        isCompact
        value={config.transcription.copyFormat}
        options={transcriptionFormats}
        onChange={handleTranscriptionChange}/>
    </>
  )
}
