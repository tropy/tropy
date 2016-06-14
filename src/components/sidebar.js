'use strict'

const React = require('react')
const T = React.PropTypes

const { Toolbar } = require('./toolbar')

const Sidebar = (props) => (
  <div id="sidebar">
    {props.children}
  </div>
)

Sidebar.propTypes = {
  children: T.node
}

const ProjectSidebar = (props) => (
  <Sidebar>
    <Toolbar/>

    <h1>{props.project.name}</h1>
    <h2>{global.R.strings.data.list.name}</h2>

  </Sidebar>
)

ProjectSidebar.propTypes = {
  project: T.shape({
    name: T.string.isRequired
  }).isRequired
}

module.exports = {
  Sidebar, ProjectSidebar
}
