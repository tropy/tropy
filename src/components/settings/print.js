import React from 'react'
import { FormElement, FormSelect, Toggle } from '../form.js'
import { useEvent } from '../../hooks/use-event.js'


const ModeOptions = ({ children, config, onChange }) => {
  return Object.entries(children).map(([name, isEnabled]) => (
    <Toggle
      key={name}
      id={`prefs.app.print.${name}`}
      name={name}
      isDisabled={!isEnabled}
      value={config[name]}
      onChange={onChange}/>
  ))
}


export function PrintSettings({
  config,
  modes = ['item', 'photo', 'selection'],
  onChange
}) {
  let handleChange = useEvent((print) => {
    onChange({ print })
  })

  return (
    <>
      <FormSelect
        id="prefs.app.print.mode"
        name="mode"
        isDisabled
        isRequired
        isSelectionHidden
        value={config.mode}
        options={modes}
        onChange={handleChange}/>

      <FormElement isCompact>
        <ModeOptions config={config} onChange={handleChange}>
          {{
            photos: config.metadata || config.notes,
            optimize: config.photos,
            metadata: config.photos || config.notes,
            notes: config.photos || config.metadata,
            onlyNotes: config.notes,
            overflow: config.metadata || config.notes
          }}
        </ModeOptions>
      </FormElement>
    </>
  )
}
