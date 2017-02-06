'use strict'

const React = require('react')
const { Resizable } = require('../resizable')
const { SearchResults } = require('../search')
const { ProjectSidebar } = require('./sidebar')
const { ProjectToolbar } = require('./toolbar')
const { func, object } = React.PropTypes


const ProjectView = (props) => {
  const zoom = props.nav.itemsZoom

  return (
    <div id="project-view">
      <Resizable edge="right" value={250}>
        <ProjectSidebar {...props}/>
      </Resizable>
      <main>
        <section id="items">
          <header>
            <ProjectToolbar
              zoom={zoom}
              onItemCreate={props.onItemCreate}
              onMaximize={props.onMaximize}
              onZoomChange={props.onItemZoomChange}/>
          </header>
          <SearchResults {...props} zoom={zoom}/>
        </section>
      </main>
    </div>
  )
}

ProjectView.propTypes = {
  nav: object.isRequired,
  onItemCreate: func.isRequired,
  onMaximize: func.isRequired,
  onItemZoomChange: func.isRequired
}


module.exports = {
  ProjectView
}
