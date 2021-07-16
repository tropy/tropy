import { FormattedMessage } from 'react-intl'
import { Button } from '../button'
import { IconWarning } from '../icons'
import { func } from 'prop-types'

export const EsperPhotoError = (props) => (
  <div className="esper-error">
    <IconWarning/>
    <FormattedMessage id="photo.error"/>
    <Button
      text="photo.consolidate"
      onClick={props.onConsolidate}/>
  </div>
)

EsperPhotoError.propTypes = {
  onConsolidate: func.isRequired
}
