'use strict'

const React = require('react')

const { IntlProvider } = require('react-intl')
const { Project } = require('../components/project')
const { Strings } = require('../common/res')


class ProjectContainer extends React.Component {
  constructor() {
    super()

    this.state = {
      locale: ARGS.locale,
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
        this.setState({ messages: strings })
      })
  }

  render() {
    return (
      <IntlProvider {...this.state} key={this.state.locale}>
        <Project/>
      </IntlProvider>
    )
  }
}

module.exports = ProjectContainer
