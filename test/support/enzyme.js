'use strict'

if (process.type === 'renderer') {
  const Enzyme = require('enzyme')
  const Adapter = require('enzyme-adapter-react-16')

  Enzyme.configure({ adapter: new Adapter() })

  //const chai = require('chai')
  //chai.use(require('chai-enzyme')())
}
