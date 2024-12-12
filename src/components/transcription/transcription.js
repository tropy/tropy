import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Alto } from './alto.js'
import { Icon } from '../icons.js'


export const Transcription = ({
  config,
  data,
  onSelect,
  selection,
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
      <div className="pending">
        <Icon name="TranscriptionExtraLarge"/>
        <FormattedMessage id="transcription.pending" tagName="p"/>
      </div>
    )

  } else if (data) {
    content = (
      <Alto
        document={data}
        onSelect={onSelect}
        selection={selection}/>
    )

  } else {
    content = (
      <pre>{text}</pre>
    )
  }

  return (
    <div
      className="transcription">
      {content}
    </div>
  )
}
