'use strict'

const chai = require('chai')
const sinon = require('sinon')
const matchers = require('./matchers')

chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
chai.use(require('chai-fs'))
chai.use(matchers.string)

global.expect = chai.expect
global.sinon = sinon
