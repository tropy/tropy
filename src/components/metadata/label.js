import React from 'react'
import { useSelector } from 'react-redux'
import { URI, pluck } from '../../common/util.js'

export const MetadataLabel = React.memo(({ children, hint, id }) => {
  let property = useSelector(state => state.ontology.props[id] || { id })
  let title = hint ||
    pluck(property, ['id', 'description', 'comment']).join('\n\n')

  return (
    <label title={title}>
      {children || property.label || URI.getLabel(property.id)}
    </label>
  )
})
