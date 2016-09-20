'use strict'

const React = require('react')

const { connect } = require('react-redux')
const { PropTypes } = React
const { FormattedMessage } = require('react-intl')
const { Toolbar } = require('./toolbar')
const { Editable } = require('./editable')
const { Lists } = require('./lists')
const { Sidebar } = require('./sidebar')
const { persist } = require('../actions/project')

const ProjectSidebar = ({
  project,
  onProjectChange,
}) => (
  <Sidebar>
    <Toolbar draggable/>

    <h1>
      <Editable
        value={project.name}
        onChange={onProjectChange}/>
    </h1>

    <FormattedMessage id="sidebar.lists"/>
    <br/>
    <Lists parent={null}/>
    <Lists parent={null} tmp/>

  </Sidebar>
)

ProjectSidebar.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired,
  onProjectChange: PropTypes.func
}

module.exports = {
  ProjectSidebar: connect(
    state => ({
      project: state.project
    }),

    dispatch => ({
      onProjectChange(name) {
        dispatch(persist({ name }))
      }
    })
  )(ProjectSidebar)
}
