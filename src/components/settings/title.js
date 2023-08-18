import { useSelector } from 'react-redux'
import { func, object } from 'prop-types'
import { FormElement, FormToggle } from '../form.js'
import { ResourceSelect } from '../resource/select.js'
import { IconItemSmall, IconPhoto } from '../icons.js'
import { useEvent } from '../../hooks/use-event.js'
import { getPropertyList } from '../../selectors/index.js'


export function TitleSettings({ config, onChange }) {
  let properties = useSelector(getPropertyList)

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
        <ResourceSelect
          icon={<IconItemSmall/>}
          id="prefs.app.title.label"
          options={properties}
          name="item"
          value={config.item}
          tabIndex={0}
          onChange={handleChange}/>
        <ResourceSelect
          icon={<IconPhoto/>}
          options={properties}
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

TitleSettings.propTypes = {
  config: object.isRequired,
  onChange: func.isRequired
}
