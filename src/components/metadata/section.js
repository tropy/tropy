import React from 'react'
import { FormattedMessage } from 'react-intl'
import { TemplateSelect } from '../template/select.js'
import cx from 'classnames'

export const MetadataSection = (props) => {
  return (
    <section onContextMenu={props.onContextMenu}>
      <h5 className={cx('metadata-heading', {
        separator: !props.template
      })}>
        <FormattedMessage
          id={props.title}
          values={{ count: props.count }}/>
      </h5>
      {props.template && (
        <TemplateSelect
          isDisabled={props.isDisabled}
          isMixed={props.isMixed}
          isRequired
          value={props.template}
          onChange={props.onTemplateChange}/>
      )}
      {props.children}
    </section>
  )
}
