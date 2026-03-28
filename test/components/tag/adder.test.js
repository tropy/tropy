import { TagAdder } from '#tropy/components/tag/adder.js'

describe('Tag autocomplete', () => {
  const matchFn = TagAdder.defaultProps.match

  it('matches from the start of the tag', () => {
    const tag = 'John Doe'
    expect(matchFn(tag, 'Jo')).to.be.ok
    expect(matchFn(tag, 'John')).to.be.ok
    expect(matchFn(tag, 'John Do')).to.be.ok
  })

  it('does not match sections from middle of words', () => {
    const tag = 'John Doe'
    expect(matchFn(tag, 'ohn')).not.to.be.ok
    expect(matchFn(tag, 'oe')).not.to.be.ok
    expect(matchFn(tag, 'n D')).not.to.be.ok
  })

  it('matching is case-insensitive', () => {
    const tag = 'John Doe'
    expect(matchFn(tag, 'jo')).to.be.ok
    expect(matchFn(tag, 'dO')).to.be.ok
    expect(matchFn(tag, 'JOHN')).to.be.ok
  })

  it('matches sections after any punctuation or whitespace', () => {
    const query = 'Doe'
    expect(matchFn('John Doe', query)).to.be.ok
    expect(matchFn('John_Doe', query)).to.be.ok
    expect(matchFn('John-Doe', query)).to.be.ok
    expect(matchFn('John.Doe', query)).to.be.ok
    expect(matchFn('John (Doe)', query)).to.be.ok
    expect(matchFn('John(Doe)', query)).to.be.ok
    expect(matchFn('John&Doe', query)).to.be.ok
    expect(matchFn('John:Doe', query)).to.be.ok
  })

  it('matches tags in non-latin scripts', () => {
    const tag = 'այբուբենի ւ (վյուն)'
    expect(matchFn(tag, 'այբո')).to.be.ok
    expect(matchFn(tag, 'վյուն')).to.be.ok
    expect(matchFn(tag, 'վյուն)')).to.be.ok
    expect(matchFn(tag, 'այբուբենի ւ (վ')).to.be.ok
  })

  it('matches tags that contain emoji', () => {
    const tag = '🚀 space 🌙'
    expect(matchFn(tag, 'space')).to.be.ok
    expect(matchFn(tag, '🚀')).to.be.ok
    expect(matchFn(tag, 'space 🌙')).to.be.ok
  })

  it('matches tags that start with punctuation', () => {
    const tag = '!important'
    expect(matchFn(tag, '!imp')).to.be.ok
    expect(matchFn(tag, 'imp')).to.be.ok
  })

  it('matches tags that contain punctuation', () => {
    const tag = 'John (Joe, Johnny) Doe'
    expect(matchFn(tag, 'Joe')).to.be.ok
    expect(matchFn(tag, 'John (Joe')).to.be.ok
    expect(matchFn(tag, 'Joe, Johnny)')).to.be.ok
  })

  it('does not match punctuation typed at the start of a query mid-tag', () => {
    const tag = 'John (Joe, Johnny) Doe'
    expect(matchFn(tag, ') Doe')).not.to.be.ok
    expect(matchFn(tag, '(Joe')).not.to.be.ok
  })
})
