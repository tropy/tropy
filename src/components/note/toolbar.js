'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { Toolbar, ToolbarLeft, ToolbarRight, ToolGroup } = require('../toolbar')
const { IconNote, IconPlus } = require('../icons')
const { IconButton } = require('../button')
const { bool, func, number } = require('prop-types')


const NoteToolbar = ({ hasCreateButton, isDisabled, notes, onCreate }) => (
  <Toolbar isDraggable={false}>
    <ToolbarLeft>
      <IconNote/>
      <h4>
        <FormattedMessage
          id="panel.note.title"
          values={{ count: notes }}/>
      </h4>
    </ToolbarLeft>
    <ToolbarRight>
      {hasCreateButton &&
        <ToolGroup>
          <IconButton
            icon={<IconPlus/>}
            isDisabled={isDisabled}
            title="panel.note.create"
            onClick={onCreate}/>
        </ToolGroup>}
    </ToolbarRight>
  </Toolbar>
)

NoteToolbar.propTypes = {
  hasCreateButton: bool,
  isDisabled: bool,
  notes: number.isRequired,
  onCreate: func.isRequired
}


module.exports = {
  NoteToolbar
}

