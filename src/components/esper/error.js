import { FormattedMessage } from 'react-intl'
import { Button } from '../button.js'
import { IconWarningLarge } from '../icons.js'

export const EsperPhotoError = ({ onConsolidate }) => (
  <div className="esper-error">
    <IconWarningLarge/>
    <p><FormattedMessage id="photo.error"/></p>
    <Button
      isDefault
      text="photo.consolidate"
      onClick={onConsolidate}/>
  </div>
)
