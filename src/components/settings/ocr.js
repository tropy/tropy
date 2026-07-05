import { FormElement, FormSlider, Toggle } from '../form.js'
import { useEvent } from '../../hooks/use-event.js'


export function OCRSettings ({ config, onChange }) {
  let handleChange = useEvent((ocr) => {
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
    </>
  )
}
