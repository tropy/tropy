'use strict'

const React = require('react')
const { PureCompnent } = React
const { FormattedMessage } = require('react-intl')
const { array, object, string } = require('prop-types')


const FlashMessage = ({ id, values }) => (
  <li className="flash-message">
    <FormattedMessage id={id} values={values}/>
  </li>
)

FlashMessage.propTypes = {
  id: string.isRequired,
  values: object
}

class Flash extends PureCompnent {
  render() {
    return this.props.messages.length > 0 && (
      <ul className="flash">
        {this.props.messages.map(msg =>
          <FlashMessage key={msg.id} {...msg}/>)}
      </ul>
    )
  }

  static propTypes = {
    messages: array.isRequired
  }
}

module.exports = {
  Flash
}
