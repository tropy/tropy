import { arrayOf, func, object, string } from 'prop-types'
import { FormElement, FormToggleGroup, Toggle } from '../form.js'
import { ESPER, ITEM } from '../../constants/index.js'

export function InterfaceSettings({
  config,
  layouts,
  onChange,
  zoomModes,
  completions
}) {
  return (
    <>
      <FormElement
        id="prefs.app.ui.label"
        isCompact>
        <Toggle
          id="prefs.app.ui.option.invertScroll"
          name="invertScroll"
          value={config.invertScroll}
          onChange={onChange}/>
        <Toggle
          id="prefs.app.ui.option.invertZoom"
          name="invertZoom"
          value={config.invertZoom}
          onChange={onChange}/>
        <Toggle
          id="prefs.app.ui.option.overlayToolbars"
          name="overlayToolbars"
          value={config.overlayToolbars}
          onChange={onChange}/>
      </FormElement>
      <FormToggleGroup
        id="prefs.app.zoomMode"
        name="zoomMode"
        isCompact
        value={config.zoomMode}
        options={zoomModes}
        onChange={onChange}/>
      <FormToggleGroup
        id="prefs.app.layout"
        name="layout"
        isCompact
        value={config.layout}
        options={layouts}
        onChange={onChange}/>
      <FormToggleGroup
        id="prefs.app.completions"
        name="completions"
        value={config.completions}
        options={completions}
        onChange={onChange}/>
    </>
  )
}

InterfaceSettings.propTypes = {
  completions: arrayOf(string).isRequired,
  config: object.isRequired,
  layouts: arrayOf(string).isRequired,
  onChange: func.isRequired,
  zoomModes: arrayOf(string).isRequired
}

InterfaceSettings.defaultProps = {
  completions: ['datatype', 'property-datatype'],
  layouts: [ITEM.LAYOUT.STACKED, ITEM.LAYOUT.SIDE_BY_SIDE],
  zoomModes: [ESPER.MODE.FIT, ESPER.MODE.FILL, ESPER.MODE.ZOOM]
}
