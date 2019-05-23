'use strict'

describe('format', () => {
  const format = __require('format')
  const { TYPE } = __require('constants')

  describe('number()', () => {
    const { number } = format

    it('formats numbers', () => {
      expect(number(42)).to.equal('42')
      expect(number(0.31234)).to.equal('0.31')
      expect(number(0.3157)).to.equal('0.32')
      expect(number(1042)).to.equal('1,042')
    })

    it('formats strings as numbers', () => {
      expect(number('42')).to.equal('42')
      expect(number('0.3157')).to.equal('0.32')
    })
  })

  describe('bytes()', () => {
    const { bytes } = format

    it('formats numbers as bytes', () => {
      expect(bytes(0)).to.equal('0 bytes')
      expect(bytes(10)).to.equal('10 bytes')
      expect(bytes(1030)).to.equal('1.01 kB')
      expect(bytes(4 * 2 ** 20)).to.equal('4 MB')
      expect(bytes(42 * 2 ** 30)).to.equal('42 GB')
      expect(bytes(5 * 2 ** 40)).to.equal('5 TB')
    })

    it('formats strings as bytes', () => {
      expect(bytes('1024.0')).to.equal('1 kB')
      expect(bytes('-1024.0')).to.equal('-1 kB')
    })

    it('falls-back to null', () => {
      expect(bytes()).to.be.null
      expect(bytes('foo')).to.be.null
    })
  })

  describe('datetime()', () => {
    const { datetime } = format

    it('formats dates', () => {
      expect(datetime(new Date(2019, 4))).to.equal('May 1, 2019, 12:00 AM')
    })

    it('formats date strings', () => {
      expect(datetime('2019')).to.equal('2019')
      expect(datetime('2019-02')).to.equal('Feb 2019')
      expect(datetime('2019-02-23')).to.equal('Feb 23, 2019')
    })

    it('converts invalid dates if possible', () => {
      expect(datetime('2019-02-29')).to.equal('Mar 1, 2019')
    })

    it('falls-back to input', () => {
      expect(datetime('-300-')).to.equal('-300-')
      expect(datetime(100)).to.equal(100)
      expect(datetime('')).to.equal('')
      expect(datetime(null)).to.equal(null)
    })

    it('uses era judiciously', () => {
      expect(datetime('0001')).to.equal('1 AD')
      expect(datetime('0981')).to.equal('981 AD')
      expect(datetime('-0041')).to.equal('42 BC')
    })
  })

  describe('auto()', () => {
    it('picks a suitable format for given type', () => {
      expect(format.auto('42000', TYPE.NUMBER)).to.equal('42,000')
      expect(format.auto('2000-12', TYPE.DATE)).to.equal('Dec 2000')
    })

    it('falls-back to input', () => {
      expect(format.auto('4200')).to.equal('4200')
    })
  })
})
