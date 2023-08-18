import React from 'react'
import { FormattedMessage } from 'react-intl'
import { TemplateSelect } from '../template/select'
import cx from 'classnames'
import { bool, func, node, number, string } from 'prop-types'

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
      {props.template &&
        <TemplateSelect
          isDisabled={props.isDisabled}
          isMixed={props.isMixed}
          isRequired
          value={props.template}
          onChange={props.onTemplateChange}/>}
      {props.children}
    </section>
  )
}

MetadataSection.propTypes = {
  children: node.isRequired,
  isDisabled: bool,
  isMixed: bool,
  count: number,
  onContextMenu: func,
  onTemplateChange: func,
  template: string,
  title: string.isRequired
}
