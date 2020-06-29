import { Filter } from 'pixi.js'
import { Shader } from '../../common/res'
import { restrict } from '../../common/util'

const FRAG = Shader.load('balance.frag')


export class BalanceFilter extends Filter {
  #max = 100
  #min = -100
  #precision = 0.002

  constructor(a = 0, b = 0) {
    super(undefined, FRAG)
    this.a = a
    this.b = b
  }

  get a() {
    return this.uniforms.a
  }

  set a(value) {
    this.uniforms.a = this.restrict(value)
  }

  get b() {
    return this.uniforms.b
  }

  get c() {
    return this.uniforms.c
  }

  set b(value) {
    this.uniforms.b = this.restrict(value)
    this.uniforms.c = this.uniforms.b * (0.33 / (this.#precision * this.#max))
  }

  set(a, b) {
    this.a = a
    this.b = b
  }

  restrict(value) {
    return restrict(value, this.#min, this.#max) * this.#precision
  }
}
