'use strict'

const React = require('react')
const { PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar, ToolGroup } = require('../toolbar')
const { IconNote, IconPlus } = require('../icons')


const NoteToolbar = ({ hasCreateButton, onCreate }) => (
  <Toolbar>
    <div className="toolbar-left">
      <IconNote/>
      <h4><FormattedMessage id="panel.notes"/></h4>
    </div>

    <div className="toolbar-right">
      {
        hasCreateButton &&
          <ToolGroup>
            <button className="btn btn-icon" onClick={onCreate}>
              <IconPlus/>
            </button>
          </ToolGroup>
      }
    </div>
  </Toolbar>
)

NoteToolbar.propTypes = {
  hasCreateButton: PropTypes.bool,
  onCreate: PropTypes.func
}


module.exports = {
  NoteToolbar
}

