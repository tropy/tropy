export default class Plugin {
  constructor(options, context) {
    this.options = options
    this.context = context
  }

  async sum(a, b) {
    return (this.options.invert) ? -(a + b) : (a + b)
  }
}
