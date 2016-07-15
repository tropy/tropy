'use strict'

const React = require('react')

const { IntlProvider } = require('react-intl')
const { Project } = require('../components/project')
const { Strings } = require('../common/res')

const { Database } = require('../common/db')
const { ipcRenderer: ipc } = require('electron')


class ProjectContainer extends React.Component {
  constructor() {
    super()

    this.state = {
      locale: ARGS.locale,
      file: ARGS.file,
      messages: null,
      defaultLocale: 'en'
    }
  }

  componentWillMount() {
    Strings
      .open(this.state.locale)

      .catch({ code: 'ENOENT' }, () =>
          Strings.open(this.state.defaultLocale))

      .then(strings => {
        this.setState({ messages: strings.flatten() })
      })

    if (this.state.file) {
      const db = new Database(this.state.file)

      db
        .get('SELECT project_id AS uuid, name FROM project')
        .then(res => this.setState(res))
        .then(() => db.close())

      ipc.send('file:opened', this.state.file)
    }
  }

  render() {
    return (!this.state.messages) ? null : (
      <IntlProvider {...this.state} key={this.state.locale}>
        <Project/>
      </IntlProvider>
    )
  }
}


module.exports = ProjectContainer
