'use strict'

const React = require('react')

const { FormattedMessage } = require('react-intl')
const { PropTypes } = React
const { Toolbar } = require('./toolbar')
const { IconFolder } = require('./icons')

const Sidebar = (props) => (
  <div id="sidebar">
    {props.children}
  </div>
)

Sidebar.propTypes = {
  children: PropTypes.node
}

const ProjectSidebar = (props) => (
  <Sidebar>
    <Toolbar/>

    <h1>{props.project.name}</h1>
    <FormattedMessage id="sidebar.lists"/>
    <br/>
    <IconFolder/>
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
