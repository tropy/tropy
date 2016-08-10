'use strict'

const React = require('react')

const { FormattedMessage } = require('react-intl')
const { PropTypes } = React
const { Toolbar } = require('./toolbar')
const { IconFolder } = require('./icons')

const Sidebar = ({ children }) => (
  <header id="sidebar">{children}</header>
)

Sidebar.propTypes = {
  children: PropTypes.node
}

const ProjectSidebar = ({ project }) => (
  <Sidebar>
    <Toolbar draggable={true}/>

    <h1>{project.name}</h1>
    <FormattedMessage id="sidebar.lists"/>
    <br/>
    <div><IconFolder/>Text</div>
    <div>Text</div>
  </Sidebar>
)

ProjectSidebar.propTypes = {
  project: PropTypes.shape({
    name: PropTypes.string.isRequired
  }).isRequired
}

module.exports = {
  Sidebar, ProjectSidebar
}
