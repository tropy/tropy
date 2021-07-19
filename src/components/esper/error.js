import { FormattedMessage } from 'react-intl'
import { Button } from '../button'
import { IconWarningLarge } from '../icons'
import { func } from 'prop-types'

export const EsperPhotoError = (props) => (
  <div className="esper-error">
    <IconWarningLarge/>
    <p><FormattedMessage id="photo.error"/></p>
    <Button
      isDefault
      text="photo.consolidate"
      onClick={props.onConsolidate}/>
  </div>
)

EsperPhotoError.propTypes = {
  onConsolidate: func.isRequired
}
