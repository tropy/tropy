'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const { FormattedMessage } = require('react-intl')
const { Toolbar, ToolbarLeft, ToolbarRight, ToolGroup } = require('../toolbar')
const { IconNote, IconPlus } = require('../icons')
const { IconButton } = require('../button')


const NoteToolbar = ({ hasCreateButton, onCreate }) => (
  <Toolbar isDraggable={false}>
    <ToolbarLeft>
      <IconNote/>
      <h4><FormattedMessage id="panel.notes"/></h4>
    </ToolbarLeft>
    <ToolbarRight>
      {hasCreateButton &&
        <ToolGroup>
          <IconButton icon={<IconPlus/>} onClick={onCreate}/>
        </ToolGroup>}
    </ToolbarRight>
  </Toolbar>
)

NoteToolbar.propTypes = {
  hasCreateButton: PropTypes.bool,
  onCreate: PropTypes.func
}


module.exports = {
  NoteToolbar
}

