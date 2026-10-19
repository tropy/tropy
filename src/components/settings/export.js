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

  let handleChange = useEvent((data) => {
    onChange({ export: data })
  })

  let handleTranscriptionFormatChange = useEvent((format) => {
    onChange({ export: { transcription: { format } } })
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
        name="note.copyFormat"
        isCompact
        value={config.note.copyFormat}
        options={noteFormats}
        onChange={handleChange}/>
      <FormToggleGroup
        id="prefs.app.export.transcription.copy"
        name="transcription.copyFormat"
        isCompact
        value={config.transcription.copyFormat}
        options={transcriptionFormats}
        onChange={handleChange}/>
    </>
  )
}
