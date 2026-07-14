import sha256 from 'crypto-js/sha256';

class PinSessionVerifier {
  private pinDigest: string | null = null;

  setPin(pin: string) {
    this.pinDigest = pin ? sha256(pin).toString() : null;
  }

  hasPin() {
    return this.pinDigest !== null;
  }

  matches(pin: string) {
    return this.pinDigest !== null && sha256(pin).toString() === this.pinDigest;
  }

  clear() {
    this.pinDigest = null;
  }
}

export default new PinSessionVerifier();
