'use strict'

const chai = require('chai')
const sinon = require('sinon')
const sinonchai = require('sinon-chai')
const matchers = require('./matchers')

chai.use(sinonchai)
chai.use(matchers.string)

global.expect = chai.expect
global.sinon = sinon
