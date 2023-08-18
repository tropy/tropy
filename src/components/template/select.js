import React from 'react'
import { useSelector } from 'react-redux'
import { bool, func, node, number, oneOf, string } from 'prop-types'
import cx from 'classnames'
import { ResourceSelect } from '../resource/select.js'
import { Select } from '../select.js'
import { match } from '../../collate.js'
import { tropy } from '../../ontology/ns.js'
import { selectTemplatesByType } from '../../selectors/ontology.js'


export const TemplateSelect = React.forwardRef(({
  isMixed,
  type,
  ...props
}, ref) => {
  let options = useSelector(state =>
    selectTemplatesByType(state, { type }))

  return (
    <ResourceSelect {...props}
      className={cx('template-select', { mixed: isMixed })}
      options={options}
      ref={ref}/>
  )
})

TemplateSelect.propTypes = {
  icon: node,
  isMixed: bool,
  match: func.isRequired,
  placeholder: string,
  tabIndex: number.isRequired,
  type: oneOf([tropy.Item, tropy.Photo, tropy.Selection])
}

TemplateSelect.defaultProps = {
  ...Select.defaultProps,
  match: (tpl, query) => (
    match(tpl.name, query, /\b\w/g)
  ),
  tabIndex: -1
}
