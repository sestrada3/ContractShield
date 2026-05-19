module.exports = {
  readAsStringAsync: jest.fn().mockResolvedValue('bW9ja2Jhc2U2NA=='),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 100 }),
  Encoding: { Base64: 'base64', UTF8: 'utf8' },
};
