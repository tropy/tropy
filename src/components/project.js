'use strict'

const React = require('react')

const { ProjectSidebar } = require('./project-sidebar')
const { Items } = require('./items')

const Project = () => (
  <div id="project">
    <ProjectSidebar/>
    <main>
      <Items/>
    </main>
  </div>
)

module.exports = {
  Project
}
