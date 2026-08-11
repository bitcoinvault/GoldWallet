import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getCodeFromHtmlBody } from '../helpers/parseVerificationCode.ts';

describe('mail verification-code parser', () => {
  it('returns the verification code from the expected element', () => {
    assert.equal(getCodeFromHtmlBody('<div id="id_pincode">123456</div>'), '123456');
  });

  it('rejects messages without the verification-code element', () => {
    assert.throws(
      () => getCodeFromHtmlBody('<div>missing</div>'),
      /Email verification code element #id_pincode was not found/,
    );
  });

  it('rejects an empty verification-code element', () => {
    assert.throws(
      () => getCodeFromHtmlBody('<div id="id_pincode"></div>'),
      /Email verification code element #id_pincode was not found/,
    );
  });
});
