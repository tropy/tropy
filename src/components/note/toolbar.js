'use strict'

const React = require('react')
const { FormattedMessage } = require('react-intl')
const { Toolbar, ToolGroup } = require('../toolbar')
const { IconNote, IconPlus } = require('../icons')
const { Button } = require('../button')
const { bool, func, number } = require('prop-types')


const NoteToolbar = ({ hasCreateButton, isDisabled, notes, onCreate }) => (
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


module.exports = {
  NoteToolbar
}
