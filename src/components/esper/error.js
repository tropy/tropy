import React from 'react'
import { useDispatch } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { Button } from '../button.js'
import { Icon } from '../icons.js'
import photo from '../../actions/photo.js'

export const EsperError = ({
  photoId
}) => {
  let dispatch = useDispatch()

  return (
    <div className="esper-error">
      <Icon name="WarningExtraLarge"/>
      <p><FormattedMessage id="photo.error"/></p>
      <Button
        isDefault
        text="photo.consolidate"
        onClick={() => {
          dispatch(photo.consolidate([photoId], {
            force: true,
            prompt: true
          }))
        }}/>
    </div>
  )
}
