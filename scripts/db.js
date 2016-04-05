'use strict'

require('shelljs/make')

const { resolve, join } = require('path')
const { assign } = Object
const { Database } = require('../lib/common/db')

const home = resolve(__dirname, '..')
const schema = join(home, 'db', 'schema.sql')

function create(file) {
  file = file || join(home, 'db', 'db.sqlite')
  rm('-f', file)

  return new Database(file).read(schema)
}

target.create = (args = []) => {
  return create(args[0]).call('close')
}

module.exports = assign({}, target)
