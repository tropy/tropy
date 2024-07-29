import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Toolbar, ToolGroup } from '../toolbar.js'
import { IconNote, IconPlusSmall } from '../icons.js'
import { Button } from '../button.js'

export const NoteToolbar = ({
  hasCreateButton,
  isDisabled,
  notes,
  onCreate
}) => (
  <Toolbar>
    <Toolbar.Left>
      <IconNote/>
      <h4>
        <FormattedMessage
          id="panel.note.title"
          values={{ count: notes }}/>
      </h4>
    </Toolbar.Left>
    <Toolbar.Right>
      {hasCreateButton && (
        <ToolGroup>
          <Button
            icon={<IconPlusSmall/>}
            isDisabled={isDisabled}
            title="panel.note.create"
            onClick={onCreate}/>
        </ToolGroup>
      )}
    </Toolbar.Right>
  </Toolbar>
)
