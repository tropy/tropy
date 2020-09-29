import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Toolbar, ToolGroup } from '../toolbar'
import { IconNote, IconPlus } from '../icons'
import { Button } from '../button'
import { bool, func, number } from 'prop-types'


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
      {hasCreateButton &&
        <ToolGroup>
          <Button
            icon={<IconPlus/>}
            isDisabled={isDisabled}
            title="panel.note.create"
            onClick={onCreate}/>
        </ToolGroup>}
    </Toolbar.Right>
  </Toolbar>
)

NoteToolbar.propTypes = {
  hasCreateButton: bool,
  isDisabled: bool,
  notes: number.isRequired,
  onCreate: func.isRequired
}
