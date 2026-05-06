import assert from 'node:assert/strict'

export class TokenSet {
  threshold = 15

  constructor (values) {
    this.parse(values)
  }

  parse (values) {
    assert.equal('Bearer', values.token_type, 'bad token type')
    assert(values.expires_in > 0, 'bad expires in')
    assert(values.access_token, 'missing access token')
    assert(values.id_token, 'missing id token')

    this.timestamp = Date.now()
    this.accessToken = values.access_token
    this.expiresIn = values.expires_in
    this.idToken = values.id_token
  }

  get age () {
    return (Date.now() - this.timestamp) / 1000
  }

  get fresh () {
    return (this.expiresIn - this.age - this.threshold) > 0
  }
}
