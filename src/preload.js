'use strict'

const decode = decodeURIComponent
const hash = window.location.hash.slice(1)
const args = Object.freeze(JSON.parse(decode(hash)))

process.env.NODE_ENV = args.environment

global.home = args.home
require('common/log')(args.home)
