'use strict'

const React = require('react')

const { createStore } = require('redux')
const { Provider, connect } = require('react-redux')
const { all } = require('bluebird')
const { Project } = require('../components/project')
const { Strings } = require('../common/res')

const ReactIntl = require('react-intl')
//const reducers = require('../reducers/project')
const reducers = (state = {}) => state

const { Database } = require('../common/db')
const { ipcRenderer: ipc } = require('electron')

const IntlProvider = connect(state => {
  const { intl } = state
  return {
    ...intl,
    key: intl.locale
  }
})(ReactIntl.IntlProvider)

function getIntlState(locale = ARGS.locale, defaultLocale = 'en') {
  return Strings
    .open(locale)

    .catch({ code: 'ENOENT' }, () =>
        Strings.open(defaultLocale))

    .then(strings => ({
      locale,
      defaultLocale,
      messages: strings.flatten()
    }))
}

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
      getIntlState()
    ])
      .then(([project, intl]) => {
        this.setState({
          store: createStore(reducers, { project, intl })
        })
      })
      .catch(error => {
        this.setState({ loading: false, error })
      })
  }

  render() {
    return (!this.state.store) ? null : (
      <Provider store={this.state.store}>
        <IntlProvider>
          <Project/>
        </IntlProvider>
      </Provider>
    )
  }
}


module.exports = ProjectContainer
