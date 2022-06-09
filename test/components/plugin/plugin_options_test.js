'use strict'

const React = require('react')
const { render, inWindowContext } = require('../../support/react')

describe('PluginOption', () => {
  const { PluginOption } = __require('components/plugin/option')
  const labelText = 'this should be in label'
  // boolean field type doesn't support label
  const fieldTypes = [
    undefined, 'text', 'template', 'property', 'save-file'
  ]
  for (const fieldType of fieldTypes) {
    it(
      `Option type "${fieldType}" has a label with a title attribute when hint is supplied`,
      () => {
        const hintText = 'this should be in title'
        const spec = { hint: hintText, label: labelText, type: fieldType }

        const { element } = render((
          <PluginOption
            spec={spec}
            templates={{ item: [], photo: [], selection: [] }}
            properties={{}} />
        ), inWindowContext)

        expect(element())
          .to.have.descendant('label')
          .and.have.text(labelText)
          .and.have.attr('title', hintText)
      })

    it(
      `Option type "${fieldType}" has a label with no title attribute when no hint is supplied`,
      () => {
        const spec = { label: labelText, type: fieldType }

        const { element } = render((
          <PluginOption
            spec={spec}
            templates={{ item: [], photo: [], selection: [] }}
            properties={{}} />
        ), inWindowContext)

        expect(element())
          .to.have.descendant('label')
          .and.have.text(labelText)
          .and.not.have.attr('title')
      })
  }
})
