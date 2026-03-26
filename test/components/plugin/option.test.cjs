import { render, inWindowContext } from '../../support/react.cjs'
import { PluginOption } from '#tropy/components/plugin/option.js'

describe('PluginOption', () => {
  const labelText = 'this should be in label'
  const fieldTypes = [
    undefined, 'text', 'bool', 'boolean', 'template', 'property', 'save-file'
  ]

  for (const fieldType of fieldTypes) {
    it(`type "${fieldType}" has label with title when hint is supplied`, () => {
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

    it(`type "${fieldType}" has label without title when no hint`, () => {
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
