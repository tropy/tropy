import { Filter } from 'pixi.js'
import { Shader } from '../../res.js'
import { restrict } from '../../common/util.js'


export class BalanceFilter extends Filter {
  constructor(a = 0, b = 0) {
    super(undefined, Shader.load('balance.frag'))
    this.a = a
    this.b = b
  }

  get a() {
    return this.uniforms.a
  }

  set a(value) {
    this.uniforms.a = restrict(value, -127, 127)
  }

  get b() {
    return this.uniforms.b
  }

  set b(value) {
    this.uniforms.b = restrict(value, -127, 127)
  }
}
