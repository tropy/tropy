import { FormElement, FormSlider, Toggle } from '../form.js'
import { ModelSelect } from '../transcription/model-select.js'
import { useEvent } from '../../hooks/use-event.js'
import { useArgs } from '../../hooks/use-args.js'


export function OCRSettings ({ config, onChange }) {
  let account = useArgs('account')

  let handleChange = useEvent((ocr) => {
    if (ocr.model != null)
      ocr = { model: ocr.model.id }
    onChange({ ocr })
  })

  return (
    <>
      <FormSlider
        id="prefs.app.ocr.quality"
        name="quality"
        isCompact
        value={config.quality}
        onChange={handleChange}/>
      <FormElement isCompact>
        <Toggle
          id="prefs.app.ocr.grayscale"
          name="grayscale"
          value={config.grayscale}
          onChange={handleChange}/>
        <Toggle
          id="prefs.app.ocr.resize"
          name="resize"
          value={config.resize}
          onChange={handleChange}/>
      </FormElement>
      <FormElement
        id="prefs.app.ocr.model.select"
        isCompact>
        <ModelSelect
          id="prefs.app.ocr.model.select"
          name="model"
          required
          isDisabled={!account?.linked}
          placeholder="prefs.app.ocr.model.placeholder"
          value={config.model}
          tabIndex={0}
          onChange={handleChange}/>
      </FormElement>
    </>
  )
}
