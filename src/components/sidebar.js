'use strict'

const React = require('react')
const { Toolbar } = require('./toolbar')


const Sidebar = (props) => (
  <div id="sidebar">
    {props.children}
  </div>
)

const ProjectSidebar = (props) => (
  <Sidebar>
    <Toolbar/>

    <h1>{props.project.name}</h1>

  </Sidebar>
)

module.exports = {
  Sidebar, ProjectSidebar
}
