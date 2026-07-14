import PinSessionVerifier from '../../src/services/PinSessionVerifier';

describe('PinSessionVerifier', () => {
  afterEach(() => {
    PinSessionVerifier.clear();
  });

  it('matches only the PIN registered for the current process', () => {
    PinSessionVerifier.setPin('1111');

    expect(PinSessionVerifier.hasPin()).toBe(true);
    expect(PinSessionVerifier.matches('1111')).toBe(true);
    expect(PinSessionVerifier.matches('1234')).toBe(false);
  });

  it('clears the process verifier when no PIN is registered', () => {
    PinSessionVerifier.setPin('1111');
    PinSessionVerifier.setPin('');

    expect(PinSessionVerifier.hasPin()).toBe(false);
    expect(PinSessionVerifier.matches('1111')).toBe(false);
  });
});
