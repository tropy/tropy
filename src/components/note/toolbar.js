import React from 'react'
import { FormattedMessage } from 'react-intl'
import { useDispatch } from 'react-redux'
import { useEvent } from '../../hooks/use-event.js'
import { Toolbar, ToolGroup } from '../toolbar.js'
import { IconNote, IconPlusSmall } from '../icons.js'
import { Button } from '../button.js'
import * as act from '../../actions/index.js'

export const NoteToolbar = ({
  hasCreateButton,
  isDisabled,
  notes
}) => {
  let dispatch = useDispatch()
  let handleCreate = useEvent(() => {
    dispatch(act.note.open())
  })

  return (
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
              onClick={handleCreate}/>
          </ToolGroup>
        )}
      </Toolbar.Right>
    </Toolbar>
  )
}
