import TYPE from '../../constants/type.js'
import { tropy } from '../../ontology/ns.js'

export const CREATED = {
  id: 'item.created',
  protected: true,
  type: TYPE.DATE
}

export const MODIFIED = {
  id: 'item.modified',
  protected: true,
  type: TYPE.DATE
}

export const TEMPLATE = {
  id: 'item.template',
  protected: true,
  type: tropy.Template
}

export const POSITION = {
  id: 'added',
  label: '',
  protected: true,
  type: TYPE.NUMBER,
  width: 60
}
