import React from 'react'
import { connect } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import * as act from '../actions/index.js'
import { IconXLarge } from './icons.js'
import { Button } from './button.js'


class FlashMessage extends React.PureComponent {
  handleConfirm = () => {
    this.props.onHide({ id: this.props.id, confirm: true })
  }

  handleDismiss = () => {
    this.props.onHide({ id: this.props.id, dismiss: true })
  }

  render() {
    return (
      <li className="flash-message">
        <span className="text-container">
          <FormattedMessage
            id={`flash.${this.props.id}.message`}
            values={this.props.values}/>
        </span>

        <button className="btn btn-primary" onClick={this.handleConfirm}>
          <FormattedMessage id={`flash.${this.props.id}.confirm`}/>
        </button>

        <Button icon={<IconXLarge/>} onClick={this.handleDismiss}/>
      </li>
    )
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

const FlashContainer = connect(
  state => ({
    messages: state.flash
  }),
  dispatch => ({
    onHide(...args) {
      dispatch(act.flash.hide(...args))
    }
  })
)(Flash)

export {
  FlashContainer as Flash
}
