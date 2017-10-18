'use strict'

const React = require('react')
const { PureComponent } = React
const { connect } = require('react-redux')
const { FormattedMessage } = require('react-intl')
const { array, func, object, string } = require('prop-types')
const act = require('../actions')


class FlashMessage extends PureComponent {
  handleConfirm = () => {
    this.props.onHide({ id: this.props.id, confirm: true })
  }

  handleDismiss = () => {
    this.props.onHide({ id: this.props.id, dismiss: true })
  }

  render() {
    return (
      <li className="flash-message">
        <FormattedMessage
          id={`flash.${this.props.id}.message`}
          values={this.props.values}/>

        <button onClick={this.handleConfirm}>
          <FormattedMessage id={`flash.${this.props.id}.confirm`}/>
        </button>

        <button onClick={this.handleDismiss}>X</button>
      </li>
    )
  }

  static propTypes = {
    id: string.isRequired,
    values: object,
    onHide: func.isRequired
  }
}


const Flash = ({ messages, onHide }) => (
  messages.length > 0 && (
    <ul className="flash">
      {messages.map(({ id, values }) =>
        <FlashMessage key={id} id={id} values={values} onHide={onHide}/>)}
    </ul>
  )
)

Flash.propTypes = {
  messages: array.isRequired,
  onHide: func.isRequired
}

module.exports = {
  Flash: connect(
    state => ({
      messages: state.flash
    }),
    dispatch => ({
      onHide(...args) {
        dispatch(act.flash.hide(...args))
      }
    })
  )(Flash)
}
