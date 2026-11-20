import { tropy } from '../../common/ns.js'
import * as datatype from '../../common/datatype.js'

export const CREATED = {
  id: 'item.created',
  protected: true,
  type: datatype.date
}

export const MODIFIED = {
  id: 'item.modified',
  protected: true,
  type: datatype.date
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
  type: datatype.number,
  width: 60
}
