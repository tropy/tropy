'use strict'

const React = require('react')

const { ProjectSidebar } = require('./sidebar')
const { Items, Item } = require('./items')

const Project = () => (
  <div id="project">
    <ProjectSidebar project={{ name: 'Tropy' }}/>
    <Items/>
    <Item/>
  </div>
)

module.exports = Project
