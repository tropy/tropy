import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Alto } from './alto.js'

export const Transcription = ({
  config,
  data,
  status = 0,
  text
}) => {
  let content

  if (status < 0) {
    content = (
      <span className="error">
        <FormattedMessage id="transcription.error"/>
        {config?.error}
      </span>
    )

  } else if (status === 0) {
    content = (
      <span className="pending">
        <FormattedMessage id="transcription.pending"/>
      </span>
    )

  } else if (data) {
    content = (
      <Alto document={data}/>
    )

  } else {
    content = (
      <pre>{text}</pre>
    )
  }

  return (
    <div className="transcription">
      {content}
    </div>
  )
}
