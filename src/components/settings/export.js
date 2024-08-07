import { FormElement, FormToggleGroup, Toggle } from '../form.js'
import { useEvent } from '../../hooks/use-event.js'

export function ExportSettings({
  config,
  noteFormats = ['text', 'markdown', 'html'],
  onChange
}) {
  let handleNoteFormatChange = useEvent((format) => {
    onChange({ export: { note: { format } } })
  })

  let handleNoteChange = useEvent((note) => {
    onChange({ export: { note } })
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
      </FormElement>
      <FormToggleGroup
        id="prefs.app.export.note.copy"
        name="copyFormat"
        isCompact
        value={config.note.copyFormat}
        options={noteFormats}
        onChange={handleNoteChange}/>
    </>
  )
}
