'use strict'

const React = require('react')
const { shallow } = require('enzyme')

const { resolve } = require('bluebird')
const { Strings } = __require('common/res')

describe('Project', () => {
  const { Project } = __require('containers/project')

  beforeEach(() => {
    sinon.stub(Strings, 'open', () => resolve(new Strings()))
  })

  afterEach(() => {
    Strings.open.restore()
  })

  describe('on mount', () => {
    it('loads localized strings', () => {
      shallow(<Project/>)
      expect(Strings.open).to.have.been.called
    })
  })
})
