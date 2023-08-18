import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AccordionGroup } from '../accordion.js'
import { VocabAccordion } from './accordion.js'
import { func } from 'prop-types'
import { getVocabs } from '../../selectors/index.js'
import * as act from '../../actions/index.js'

export const VocabBrowser = ({ onOpenLink }) => {
  let dispatch = useDispatch()

  let vocabs = useSelector(getVocabs)

  let handleSave = useCallback((...args) => {
    dispatch(act.ontology.vocab.save(...args))
  }, [dispatch])

  let handleClassSave = useCallback((...args) => {
    dispatch(act.ontology.class.save(...args))
  }, [dispatch])

  let handlePropsSave = useCallback((...args) => {
    dispatch(act.ontology.props.save(...args))
  }, [dispatch])

  let handleExport = useCallback((...args) => {
    dispatch(act.ontology.vocab.export(...args))
  }, [dispatch])

  let handleDelete = useCallback((...args) => {
    dispatch(act.ontology.vocab.delete(...args))
  }, [dispatch])

  return (
    <AccordionGroup
      className="form-horizontal"
      tabIndex={0}>
      {vocabs.map(vocab =>
        <VocabAccordion
          key={vocab.id}
          id={vocab.id}
          vocab={vocab}
          onClassSave={handleClassSave}
          onDelete={handleDelete}
          onExport={handleExport}
          onOpenLink={onOpenLink}
          onPropsSave={handlePropsSave}
          onSave={handleSave}/>)}
    </AccordionGroup>
  )
}

VocabBrowser.propTypes = {
  onOpenLink: func
}
