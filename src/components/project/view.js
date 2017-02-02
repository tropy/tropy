'use strict'

const React = require('react')
const { Resizable } = require('../resizable')
const { Items } = require('../item')
const { ProjectSidebar } = require('./sidebar')

const ProjectView = (props) => (
  <div id="project-view">
    <Resizable edge="right" value={250}>
      <ProjectSidebar {...props} hasToolbar={ARGS.frameless}/>
    </Resizable>
    <main>
      <Items {...props}/>
    </main>
  </div>
)

module.exports = {
  ProjectView
}
