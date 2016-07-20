'use strict'

const React = require('react')

//const { connect } = require('react-redux')
const { all } = require('bluebird')
const { Project } = require('../components/project')

const { Database } = require('../common/db')
const { ipcRenderer: ipc } = require('electron')

function getProjectState(file = ARGS.file) {
  const db = new Database(file)

  db
    .get('SELECT project_id AS uuid, name FROM project')
    .tap(() => ipc.send('file:opened', file))
    .finally(() => db.close())
}


class ProjectContainer extends React.Component {
  constructor() {
    super()

    this.state = {
      loaded: false, loading: true, error: false
    }
  }

  componentWillMount() {
    all([
      getProjectState(),
    ])
      //.then(([project, intl]) => {
      //  this.setState({
      //    store: createStore(reducers, { project, intl })
      //  })
      //})
      //.catch(error => {
      //  this.setState({ loading: false, error })
      //})
  }

  render() {
    return (
      <Project/>
    )
  }
}


module.exports = {
  Project: ProjectContainer
}
