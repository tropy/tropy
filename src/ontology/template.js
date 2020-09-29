import fs from 'fs'
import { identify, pick } from '../common/util'
import { ONTOLOGY, TYPE } from '../constants'
import { tropy } from './ns'

const { readFile: read, writeFile: write } = fs.promises


export class Template {
  static defaults = {
    type: tropy.Item,
    name: '',
    creator: '',
    description: '',
    created: undefined,
    isProtected: false,
    fields: []
  }

  static identify() {
    return `https://tropy.org/v1/templates/id#${identify()}`
  }

  static make(template = Template.defaults) {
    return {
      ...template,
      id: template.id || Template.identify(),
      fields: [...template.fields]
    }
  }

  static copy(template, mapField = Field.copy) {
    return {
      ...pick(template, Template.keys),
      created: undefined,
      isProtected: false,
      fields: template.fields.map(mapField)
    }
  }

  static async open(path) {
    return JSON.parse(await read(path))
  }

  static save(data, path, options = {}) {
    return write(path, JSON.stringify(Template.parse(data)), options)
  }

  static parse(data) {
    return {
      '@context': ONTOLOGY.TEMPLATE.CONTEXT,
      '@id': data.id,
      '@type': tropy.Template,
      'type': data.type,
      'name': data.name,
      'version': data.version,
      'domain': data.domain,
      'creator': data.creator,
      'description': data.description,
      'field': data.fields.map(Field.copy)
    }
  }

  static keys = Object.keys(Template.defaults)
}


class Field {
  static defaults = {
    datatype: TYPE.TEXT,
    hint: '',
    isConstant: false,
    isRequired: false,
    label: '',
    property: '',
    value: ''
  }

  static identify() {
    return Field.counter--
  }

  static make(field = Field.defaults) {
    return {
      id: field.id || Field.identify(),
      ...field
    }
  }

  static copy(field) {
    return pick(field, Field.keys)
  }

  static counter = -1
  static keys = Object.keys(Field.defaults)
}

Template.Field = Field
