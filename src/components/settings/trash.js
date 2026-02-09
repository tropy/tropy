import { FormToggleGroup } from '../form.js'

export function TrashSettings({
  deleteTrashOptions = ['close', 'daily', 'weekly', 'monthly'],
  config,
  onChange
}) {
  return (
    <FormToggleGroup
      id="prefs.app.deleteTrash"
      name="deleteTrash"
      value={config.deleteTrash}
      options={deleteTrashOptions}
      onChange={onChange}/>
  )
}
