import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FormattedMessage } from 'react-intl'
import { flash } from '../actions/index.js'
import { IconXLarge } from './icons.js'
import { Button } from './button.js'

const FlashMessage = ({
  id,
  onHide,
  values
}) => (
  <li className="flash-message">
    <span className="text-container">
      <FormattedMessage id={`flash.${id}.message`} values={values}/>
    </span>

    <button className="btn btn-primary" onClick={() => {
      onHide({ id, confirm: true })
    }}>
      <FormattedMessage id={`flash.${id}.confirm`}/>
    </button>

    <Button icon={<IconXLarge/>} onClick={() => {
      onHide({ id, dismiss: true })
    }}/>
  </li>
)


export const Flash = () => {
  let dispatch = useDispatch()
  let messages = useSelector(state => state.flash)

  let onHide = useCallback((...args) => {
    dispatch(flash.hide(...args))
  })

  if (!(messages?.length > 0))
    return null

  return (
    <ul className="flash">
      {messages.map(({ id, values }) =>
        <FlashMessage
          key={id}
          id={id}
          values={values}
          onHide={onHide}/>)}
    </ul>
  )
}
