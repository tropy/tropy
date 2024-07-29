import { FormElement, FormToggle } from '../form.js'
import { PropertySelect } from '../resource/select.js'
import { IconItemSmall, IconPhoto } from '../icons.js'
import { useEvent } from '../../hooks/use-event.js'


export function TitleSettings({ config, onChange }) {
  let handleChange = useEvent((values, hasChanged) => {
    if (hasChanged) {
      let [name, value] = Object.entries(values)[0]
      if (value && value.id) value = value.id
      onChange({
        title: {
          [name]: value
        }
      })
    }
  })

  return (
    <>
      <FormElement
        id="prefs.app.title.label"
        isCompact>
        <PropertySelect
          icon={<IconItemSmall/>}
          id="prefs.app.title.label"
          name="item"
          value={config.item}
          tabIndex={0}
          onChange={handleChange}/>
        <PropertySelect
          icon={<IconPhoto/>}
          name="photo"
          value={config.photo}
          tabIndex={0}
          onChange={handleChange}/>
      </FormElement>
      <FormToggle
        id="prefs.app.title.force"
        name="force"
        value={config.force}
        onChange={handleChange}/>
    </>
  )
}
