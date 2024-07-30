import { string } from './matchers.js'
import { expect, use } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'

use(sinonChai)
use(chaiAsPromised)
use(string)

global.expect = expect
global.sinon = sinon
