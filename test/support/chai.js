'use strict'

const chai = require('chai')
const sinon = require('sinon')
const sinonchai = require('sinon-chai')

chai.use(sinonchai)

global.expect = chai.expect
global.sinon = sinon
