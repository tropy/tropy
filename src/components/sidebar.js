'use strict'

const React = require('react')

const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { PropTypes } = React
const { Toolbar } = require('./toolbar')
const { IconFolder } = require('./icons')
const { Editable } = require('./editable')
const { update } = require('../actions/project')

const Sidebar = ({ children }) => (
  <header id="sidebar">{children}</header>
)

Sidebar.propTypes = {
  children: PropTypes.node
}

const ProjectSidebar = ({ project, onProjectChange }) => (
  <Sidebar>
    <Toolbar draggable/>

    <h1>
      <Editable
        value={project.name}
        onChange={onProjectChange}/>
    </h1>

    <FormattedMessage id="sidebar.lists"/>
    <br/>
    <div><IconFolder/>Text</div>
    <div>Text</div>
  </Sidebar>
)

ProjectSidebar.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired,
  onProjectChange: PropTypes.func
}

module.exports = {
  Sidebar,

  ProjectSidebar: connect(
    state => ({
      project: state.project
    }),
    dispatch => ({
      onProjectChange(name) {
        dispatch(update({ name }))
      }
    })
  )(ProjectSidebar)
}
