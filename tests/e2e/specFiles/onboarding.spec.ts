import { expect as jestExpect } from '@jest/globals';
import { device, expect, waitFor } from 'detox';

import { isBeta } from '../helpers/utils';
import app from '../pageObjects';

const loadMailing = async () => {
  const mailing = await import('../mailing');

  return {
    mailosaur: mailing.default,
    Subject: mailing.Subject,
  };
};

describe('Onboarding', () => {
  beforeEach(async () => {
    isBeta() && (await app.onboarding.betaVersionScreen.close());

    await app.developerRoom.tapOnSkipTermsConditionsButton();
  });

  describe('@android @ios @smoke', () => {
    it('should be possible to pass onboarding and skip adding email address', async () => {
      await app.onboarding.createPinScreen.typePin('1111');
      await app.onboarding.confirmPinScreen.typePin('1111');

      await app.onboarding.createPasswordScreen.typePassword('qwertyui');
      await app.onboarding.createPasswordScreen.submit();

      await app.onboarding.confirmPasswordScreen.typePassword('qwertyui');
      await app.onboarding.confirmPasswordScreen.submit();

      await app.onboarding.addEmailNotificationScreen.skip();

      await waitFor(app.onboarding.successScreen.icon).toBeVisible().withTimeout(20000);
    });
  });

  it('should be possible to pass onboarding and add an email address', async () => {
    const { mailosaur, Subject } = await loadMailing();
    const emailAddress = mailosaur.generateAddress();

    await app.onboarding.createPinScreen.typePin('1111');
    await app.onboarding.confirmPinScreen.typePin('1111');

    await app.onboarding.createPasswordScreen.typePassword('qwertyui');
    await app.onboarding.createPasswordScreen.submit();

    await app.onboarding.confirmPasswordScreen.typePassword('qwertyui');
    await app.onboarding.confirmPasswordScreen.submit();

    await app.onboarding.addEmailNotificationScreen.typeEmailAddress(emailAddress);
    await app.onboarding.addEmailNotificationScreen.submit();

    const code = await mailosaur.getCode(emailAddress, Subject.ADD_EMAIL);

    await app.onboarding.confirmEmailAddressScreen.typeCode(code);
    await app.onboarding.confirmEmailAddressScreen.submit();

    await waitFor(app.onboarding.successScreen.icon).toBeVisible().withTimeout(20000);
  });

  it('should be possible to resend the code while adding an email address', async () => {
    const { mailosaur, Subject } = await loadMailing();
    const emailAddress = mailosaur.generateAddress();

    await app.onboarding.createPinScreen.typePin('1111');
    await app.onboarding.confirmPinScreen.typePin('1111');

    await app.onboarding.createPasswordScreen.typePassword('qwertyui');
    await app.onboarding.createPasswordScreen.submit();

    await app.onboarding.confirmPasswordScreen.typePassword('qwertyui');
    await app.onboarding.confirmPasswordScreen.submit();

    await app.onboarding.addEmailNotificationScreen.typeEmailAddress(emailAddress);
    await app.onboarding.addEmailNotificationScreen.submit();

    await mailosaur.ignoreEmail(emailAddress);

    // NOTE: disabling synchronization because after tapping resend
    // some background process prevent detox from continuing the test
    await device.disableSynchronization();
    await app.onboarding.confirmEmailAddressScreen.tapOnResendButton();

    const code = await mailosaur.getCode(emailAddress, Subject.ADD_EMAIL);

    await app.onboarding.confirmEmailAddressScreen.typeCode(code);
    await app.onboarding.confirmEmailAddressScreen.submit();

    await waitFor(app.onboarding.successScreen.icon).toBeVisible().withTimeout(20000);
  });

  describe('@android @ios @regression', () => {
    it("should display an error message if typed PIN on confirmation page doesn't match", async () => {
      await app.onboarding.createPinScreen.typePin('1111');
      await app.onboarding.confirmPinScreen.typePin('2222');

      await expect(app.onboarding.confirmPinScreen.pinValidationError).toBeVisible();
    });

    it("should display an error message if typed transaction password on confirmation page doesn't match", async () => {
      await app.onboarding.createPinScreen.typePin('1111');
      await app.onboarding.confirmPinScreen.typePin('1111');

      await app.onboarding.createPasswordScreen.typePassword('qwertyui');
      await app.onboarding.createPasswordScreen.submit();

      await app.onboarding.confirmPasswordScreen.typePassword('asdfghjk\n');
      await app.onboarding.confirmPasswordScreen.submit();

      await expect(app.onboarding.confirmPasswordScreen.passwordValidationError).toBeVisible();
    });

    it('should display an error message if typed email address is invalid', async () => {
      await app.onboarding.createPinScreen.typePin('1111');
      await app.onboarding.confirmPinScreen.typePin('1111');

      await app.onboarding.createPasswordScreen.typePassword('qwertyui');
      await app.onboarding.createPasswordScreen.submit();

      await app.onboarding.confirmPasswordScreen.typePassword('qwertyui');
      await app.onboarding.confirmPasswordScreen.submit();

      await app.onboarding.addEmailNotificationScreen.typeEmailAddress('cloudbest.qagmail.com');
      await app.onboarding.addEmailNotificationScreen.submit();

      await expect(app.onboarding.addEmailNotificationScreen.emailValidationError).toBeVisible();
    });

    it('should display an error message if typed code is invalid', async () => {
      const { mailosaur } = await loadMailing();

      await app.onboarding.createPinScreen.typePin('1111');
      await app.onboarding.confirmPinScreen.typePin('1111');

      await app.onboarding.createPasswordScreen.typePassword('qwertyui');
      await app.onboarding.createPasswordScreen.submit();

      await app.onboarding.confirmPasswordScreen.typePassword('qwertyui');
      await app.onboarding.confirmPasswordScreen.submit();

      await app.onboarding.addEmailNotificationScreen.typeEmailAddress(mailosaur.generateAddress());
      await app.onboarding.addEmailNotificationScreen.submit();

      await app.onboarding.confirmEmailAddressScreen.typeCode('1111');
      await app.onboarding.confirmEmailAddressScreen.submit();

      await expect(app.onboarding.confirmEmailAddressScreen.pincodeValidationError).toBeVisible();
    });

    it('should display an error message and send a code if exceeded a limit of attempts of sending codes', async () => {
      const { mailosaur, Subject } = await loadMailing();
      const emailAddress = mailosaur.generateAddress();

      await app.onboarding.createPinScreen.typePin('1111');
      await app.onboarding.confirmPinScreen.typePin('1111');

      await app.onboarding.createPasswordScreen.typePassword('qwertyui');
      await app.onboarding.createPasswordScreen.submit();

      await app.onboarding.confirmPasswordScreen.typePassword('qwertyui');
      await app.onboarding.confirmPasswordScreen.submit();

      await app.onboarding.addEmailNotificationScreen.typeEmailAddress(emailAddress);
      await app.onboarding.addEmailNotificationScreen.submit();

      await mailosaur.ignoreEmail(emailAddress);

      await app.onboarding.confirmEmailAddressScreen.typeCode('1111');
      await app.onboarding.confirmEmailAddressScreen.submit();
      await app.onboarding.confirmEmailAddressScreen.typeCode('2222');
      await app.onboarding.confirmEmailAddressScreen.submit();
      await app.onboarding.confirmEmailAddressScreen.typeCode('3333');
      await app.onboarding.confirmEmailAddressScreen.submit();

      const code = await mailosaur.getCode(emailAddress, Subject.ADD_EMAIL);

      await expect(app.onboarding.confirmEmailAddressScreen.pincodeValidationError).toBeVisible();
      jestExpect(code).toBeDefined();
    });
  });
});
