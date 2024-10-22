import { useDispatch, useSelector } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { ToolButton } from '../toolbar.js'
import settings from '../../actions/settings.js'

export const MaximizeButton = ({ isDisabled, name }) => {
  let dispatch = useDispatch()
  let current = useSelector(state => state.settings.maximize)

  let handleChange = useEvent(({ maximize }) => {
    dispatch(settings.update({ maximize }))
  })

  return (
    <ToolButton
      activeIcon="IconMinimize"
      current={current}
      defaultValue="none"
      icon="IconMaximize"
      isDisabled={isDisabled}
      name="maximize"
      onChange={handleChange}
      title={`settings.${current === name ? 'un' : ''}maximize`}
      value={name}/>
  )
}
