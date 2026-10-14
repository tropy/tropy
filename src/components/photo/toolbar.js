import { FormattedMessage } from 'react-intl'
import { Slider } from '../slider.js'
import { Button } from '../button.js'
import { Toolbar, ToolGroup } from '../toolbar.js'
import { Icon } from '../icons.js'
import { SASS } from '../../constants/index.js'


export const PhotoToolbar = ({
  hasCreateButton,
  isClosed,
  isDisabled,
  maxZoom = SASS.PHOTO.ZOOM.length - 1,
  onCreate,
  onTranscribe,
  onTranscribePrompt,
  onZoomChange,
  photos,
  zoom = 0
}) => (
  <Toolbar>
    <Toolbar.Left>
      <Icon name="Photo"/>
      <h4>
        <FormattedMessage
          id="panel.photo.title"
          values={{ count: photos }}/>
      </h4>
    </Toolbar.Left>
    <Toolbar.Right>
      {
        <>
          {hasCreateButton && (
            <ToolGroup>
              <Button
                icon="PlusSmall"
                size="sm"
                isDisabled={isDisabled}
                title="panel.photo.create"
                onClick={onCreate}/>
            </ToolGroup>
          )}
          <ToolGroup>
            <Button
              icon="TranscriptionSmall"
              size="sm"
              isDisabled={isDisabled}
              title="panel.photo.transcribe"
              onClick={onTranscribe}/>
            <Button
              icon="GearSmall"
              size="sm"
              isDisabled={isDisabled}
              title="panel.photo.transcribeDialog"
              onClick={onTranscribePrompt}/>
          </ToolGroup>
        </>
      }
      <ToolGroup>
        <Slider
          value={zoom}
          max={maxZoom}
          size="sm"
          minIcon="ListSmall"
          maxIcon="GridSmall"
          isDisabled={isClosed || photos === 0}
          tabIndex={-1}
          onChange={onZoomChange}/>
      </ToolGroup>
    </Toolbar.Right>
  </Toolbar>
)
