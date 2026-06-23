import { by, element } from 'detox';

import actions from '../../actions';
import MessageScreen from '../common/MessageScreen';

const Onboarding = () => ({
  betaVersionScreen: {
    closeButton: element(by.id('close-beta-version-screen')),

    async close(): Promise<void> {
      await actions.tap(this.closeButton);
    },
  },

  createPinScreen: {
    pinInput: element(by.id('create-pin-input')),

    async typePin(value: string): Promise<void> {
      await actions.typeText(this.pinInput, value);
    },
  },

  confirmPinScreen: {
    pinInput: element(by.id('confirm-pin-input')),
    pinValidationError: element(by.id('confirm-pin-input-validation-error')),

    async typePin(value: string): Promise<void> {
      await actions.typeText(this.pinInput, value);
    },
  },

  createPasswordScreen: {
    passowrdInput: element(by.id('create-transaction-password')),
    submitButton: element(by.id('submit-create-transaction-password')),

    async typePassword(value: string): Promise<void> {
      await actions.typeText(this.passowrdInput, value, { closeKeyboard: true });
    },

    async submit(): Promise<void> {
      await actions.tap(this.submitButton);
    },
  },

  confirmPasswordScreen: {
    passowrdInput: element(by.id('confirm-transaction-password')),
    passwordValidationError: element(by.id('confirm-transaction-password-validation-error')),
    submitButton: element(by.id('submit-transaction-password-confirmation')),

    async typePassword(value: string): Promise<void> {
      await actions.typeText(this.passowrdInput, value, { closeKeyboard: true });
    },

    async submit(): Promise<void> {
      await actions.tap(this.submitButton);
    },
  },

  addEmailNotificationScreen: {
    emailInput: element(by.id('add-email-input')),
    emailValidationError: element(by.id('add-email-input-validation-error')),

    submitButton: element(by.id('submit-add-email-button')),
    skipEmailNotificationButton: element(by.id('skip-adding-email-button')),

    async typeEmailAddress(value: string) {
      await actions.typeText(this.emailInput, value);
    },

    async submit() {
      await actions.tap(this.submitButton);
    },

    async skip() {
      await actions.tap(this.skipEmailNotificationButton);
    },
  },

  confirmEmailAddressScreen: {
    pincode: element(by.id('confirm-code-input')),
    pincodeValidationError: element(by.id('confirm-code-input-validation-error')),

    submitButton: element(by.id('confirm-code-email-button')),
    resendButton: element(by.id('resend-code-email-button')),

    async typeCode(value: string) {
      await actions.typeText(this.pincode, value);
    },

    async submit() {
      await actions.tap(this.submitButton);
    },

    async tapOnResendButton() {
      await actions.tap(this.resendButton);
    },
  },

  successScreen: MessageScreen('success'),
});

export default Onboarding;
