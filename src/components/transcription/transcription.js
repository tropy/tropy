import React from 'react'
import { FormattedMessage } from 'react-intl'
import { Alto } from './alto.js'
import { TranscriptionError } from './error.js'
import { Icon } from '../icons.js'


export const Transcription = ({
  config,
  data,
  onSelect,
  selection,
  status = 0,
  tabIndex = -1,
  text
}) => {
  let content

  if (status < 0) {
    content = (
      <TranscriptionError config={config}/>
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
    <div className="transcription" tabIndex={tabIndex}>
      {content}
    </div>
  )
}
