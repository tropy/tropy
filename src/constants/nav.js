import TYPE from './type.js'
import { tropy } from '../ontology/ns.js'

export const MODE = {
  PROJECT: 'project',
  ITEM: 'item'
}

export default {
  PERSIST: 'nav.persist',
  RESTORE: 'nav.restore',
  SEARCH: 'nav.search',
  SELECT: 'nav.select',
  SORT: 'nav.sort',
  UPDATE: 'nav.update',
  MODE,

  COLUMN: {
    INSERT: 'nav.column.insert',
    ORDER: 'nav.column.order',
    REMOVE: 'nav.column.remove',
    RESIZE: 'nav.column.resize',

    CREATED: {
      id: 'item.created',
      protected: true,
      type: TYPE.DATE
    },
    MODIFIED: {
      id: 'item.modified',
      protected: true,
      type: TYPE.DATE
    },
    TEMPLATE: {
      id: 'item.template',
      protected: true,
      type: tropy.Template
    },
    POSITION: {
      id: 'added',
      label: '',
      protected: true,
      type: TYPE.NUMBER,
      width: 60
    }
  }
}
