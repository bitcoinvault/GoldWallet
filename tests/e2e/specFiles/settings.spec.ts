import { expect as jestExpect } from '@jest/globals';
import { device, expect } from 'detox';

import { DEFAULT_UNLOCK_PIN, ecdsaKeys } from '../data';
import { isBeta } from '../helpers/utils';
import mailing, { Subject } from '../mailing';
import app from '../pageObjects';
import { SupportedLanguage } from '../pageObjects/pages/settings/LanguageScreen';
import steps from '../steps';
import { WalletType } from '../types';

describe('Settings', () => {
  describe('General', () => {
    beforeEach(async () => {
      isBeta() && (await app.onboarding.betaVersionScreen.close());
      await app.developerRoom.tapOnSkipOnboardingButton();
      await app.onboarding.addEmailNotificationScreen.skip();
      await app.navigationBar.changeTab('settings');
    });

    describe('@android @ios @smoke', () => {
      it('should display Settings screen correctly', async () => {
        expect(app.settings.settingsScreen.goldWalletIcon).toBeVisible();
      });
    });

    describe('@regression', () => {
      describe('@android @ios', () => {
        it('should be possible to turn on advanced options', async () => {
          await app.settings.settingsScreen.tapOnAdvancedOptions();
          await app.settings.advancedOptionsScreen.tapOnAdvancedOptionsSwitch();

          await app.header.tapOnBackButton();
          await app.navigationBar.changeTab('wallets');

          await app.dashboard.dashboardScreen.tapOnAddWalletButton();

          await expect(app.wallets.addNewWallet.createScreen.walletTypeRadios[WalletType.S_HD_P2SH]).toBeVisible();
          await expect(app.wallets.addNewWallet.createScreen.walletTypeRadios[WalletType.S_HD_SEGWIT]).toBeVisible();
          await expect(app.wallets.addNewWallet.createScreen.walletTypeRadios[WalletType.S_P2SH]).toBeVisible();
        });

        it('should be possible change PIN', async () => {
          await app.settings.settingsScreen.tapOnChangePin();

          await app.settings.changePin.currentPinScreen.typePin(DEFAULT_UNLOCK_PIN);
          await app.settings.changePin.newPinScreen.typePin('1111');
          await app.settings.changePin.confirmPinScreen.typePin('1111');

          await expect(app.settings.changePin.successScreen.icon).toBeVisible();
          await app.settings.changePin.successScreen.close();
          await app.settings.settingsScreen.tapOnChangePin();
          await app.settings.changePin.currentPinScreen.typePin('1111');
          await expect(app.settings.changePin.newPinScreen.pinInput).toBeVisible();
        });

        it('should display an error validation message if typed current PIN is incorrect', async () => {
          await app.settings.settingsScreen.tapOnChangePin();
          await app.settings.changePin.currentPinScreen.typePin('0000');

          await expect(app.settings.changePin.currentPinScreen.pinValidationError).toBeVisible();
        });

        it('should show "Application blocked" screen if number of attemps is exceeded', async () => {
          await app.settings.settingsScreen.tapOnChangePin();

          await app.settings.changePin.currentPinScreen.typePin('0000');
          await app.settings.changePin.currentPinScreen.typePin('0000');
          await app.settings.changePin.currentPinScreen.typePin('0000');

          await expect(app.settings.changePin.applicationBlockedScreen.header).toBeVisible();
        });

        it('should display an error validation message if typed confirmation PIN is incorrect', async () => {
          await app.settings.settingsScreen.tapOnChangePin();

          await app.settings.changePin.currentPinScreen.typePin(DEFAULT_UNLOCK_PIN);
          await app.settings.changePin.newPinScreen.typePin('1111');
          await app.settings.changePin.confirmPinScreen.typePin('1000');

          await expect(app.settings.changePin.confirmPinScreen.pinValidationError).toBeVisible();
        });

        it('should be possible to get access to About screen', async () => {
          await app.settings.settingsScreen.tapOnAboutUs();

          await expect(app.settings.aboutUsScreen.goToOurGithubButton).toBeVisible();
        });

        const walletsInLocalLanguages: { [key in Exclude<SupportedLanguage, 'English'>]: string } = {
          Chinese: '钱包',
          Spanish: 'Monederos',
          Indonesian: 'Dompet',
          Japanese: 'ウォレット',
          Korean: '지갑',
          Portuguese: 'Carteiras',
          Vietnamese: 'Ví',
          Turkish: 'Cüzdanlar',
        };

        (Object.keys(walletsInLocalLanguages) as Array<keyof typeof walletsInLocalLanguages>).forEach(language =>
          it(`should be possible to change language from English to ${language}`, async () => {
            await app.settings.settingsScreen.tapOnLanguage();
            await app.settings.languageScreen.chooseLanguage(language as SupportedLanguage);
            await app.settings.languageScreen.confirmLanguageChange();

            await expect(app.dashboard.dashboardScreen.header).toHaveText(walletsInLocalLanguages[language]);
          }),
        );
      });

      describe('@ios', () => {
        // TODO: For now, it's not possible to test it. Requires changes in the app
        xit('should be possible to enable biometric and unlock the app using biometric method', async () => undefined);

        // TODO: For now, it's not possible to test it. Requires changes in the app
        xit('should be possible to disable biometric and unlock the app using PIN', async () => undefined);
      });
    });
  });

  describe('Email notifications', () => {
    describe.skip('Add email', () => {
      beforeEach(async () => {
        isBeta() && (await app.onboarding.betaVersionScreen.close());
        await app.developerRoom.tapOnSkipOnboardingButton();
        await app.onboarding.addEmailNotificationScreen.skip();
        await app.navigationBar.changeTab('settings');
      });

      describe('@android @ios @smoke', () => {
        it('should display the "Add your email address" if a user skipped this step on onboarding', async () => {
          await app.settings.settingsScreen.tapOnEmailNotifications();

          await expect(app.settings.emailNotifications.noEmailAddedScreen.noEmailAddressIcon).toBeVisible();
        });
      });

      describe('@android @ios @regression', () => {
        it('should be possible to add an email address if a user skipped this step on onboarding', async () => {
          const email = mailing.generateAddress();

          await app.settings.settingsScreen.tapOnEmailNotifications();
          await app.settings.emailNotifications.noEmailAddedScreen.tapOnTapEmailButton();

          await app.settings.emailNotifications.addEmailAddressScreen.typeEmail(email);
          await app.settings.emailNotifications.addEmailAddressScreen.submit();

          const code = await mailing.getCode(email, Subject.ADD_EMAIL);

          await app.settings.emailNotifications.confirmEmailAddressScreen.typeCode(code);
          await app.settings.emailNotifications.confirmEmailAddressScreen.submit();

          await expect(app.settings.emailNotifications.successScreen.icon).toBeVisible();
        });

        it('should be possible to add an email address and subscribe a wallet to notifications', async () => {
          const walletName = 'Goofy wallet';

          await steps.createWallet({
            type: WalletType.KEY_3,
            name: walletName,
            secrets: ecdsaKeys,
          });

          await app.navigationBar.changeTab('settings');

          const email = mailing.generateAddress();

          await app.settings.settingsScreen.tapOnEmailNotifications();
          await app.settings.emailNotifications.noEmailAddedScreen.tapOnTapEmailButton();

          await app.settings.emailNotifications.addEmailAddressScreen.typeEmail(email);
          await app.settings.emailNotifications.addEmailAddressScreen.submit();

          await app.settings.emailNotifications.getNotificationsScreen.selectWallet(walletName);
          await app.settings.emailNotifications.getNotificationsScreen.tapOnConfirmButton();

          const code = await mailing.getCode(email, Subject.SUBSCRIBE);

          await app.settings.emailNotifications.verifyActionScreen.typeCode(code);
          await app.settings.emailNotifications.verifyActionScreen.submit();

          await expect(app.settings.emailNotifications.successScreen.icon).toBeVisible();
        });

        it('should be possible to add an email address and subscribe multiple wallets to notifications', async () => {
          await steps.createWallet({
            type: WalletType.S_HD_P2SH,
            name: 'Main',
          });

          await steps.createWallet({
            type: WalletType.S_HD_P2SH,
            name: 'Secondary',
          });

          const email = mailing.generateAddress();

          await app.navigationBar.changeTab('settings');

          await app.settings.settingsScreen.tapOnEmailNotifications();
          await app.settings.emailNotifications.noEmailAddedScreen.tapOnTapEmailButton();

          await app.settings.emailNotifications.addEmailAddressScreen.typeEmail(email);
          await app.settings.emailNotifications.addEmailAddressScreen.submit();

          await app.settings.emailNotifications.getNotificationsScreen.selectAllWallets();
          await app.settings.emailNotifications.getNotificationsScreen.tapOnConfirmButton();

          const code = await mailing.getCode(email, Subject.SUBSCRIBE);

          await app.settings.emailNotifications.verifyActionScreen.typeCode(code);
          await app.settings.emailNotifications.verifyActionScreen.submit();

          await expect(app.settings.emailNotifications.successScreen.icon).toBeVisible();
        });

        it('should be possible to add an email address and without subscribing to notifications if a wallet exists', async () => {
          await steps.createWallet({
            type: WalletType.KEY_3,
            name: 'Main',
            secrets: ecdsaKeys,
          });

          const email = mailing.generateAddress();

          await app.navigationBar.changeTab('settings');

          await app.settings.settingsScreen.tapOnEmailNotifications();
          await app.settings.emailNotifications.noEmailAddedScreen.tapOnTapEmailButton();

          await app.settings.emailNotifications.addEmailAddressScreen.typeEmail(email);
          await app.settings.emailNotifications.addEmailAddressScreen.submit();

          await app.settings.emailNotifications.getNotificationsScreen.tapOnSkipButton();

          const code = await mailing.getCode(email, Subject.ADD_EMAIL);

          await app.settings.emailNotifications.confirmEmailAddressScreen.typeCode(code);
          await app.settings.emailNotifications.confirmEmailAddressScreen.submit();

          await expect(app.settings.emailNotifications.successScreen.icon).toBeVisible();
        });
      });
    });

    describe('Change email address', () => {
      let emailAddress: string;

      beforeEach(async () => {
        emailAddress = mailing.generateAddress();

        isBeta() && (await app.onboarding.betaVersionScreen.close());
        await app.developerRoom.typeEmailAddress(emailAddress);
        await app.developerRoom.tapOnSkipOnboardingWithEmailButton();
      });

      describe('@android @ios @regression', () => {
        it('should be possible to change the email address without having any wallets added', async () => {
          const newEmail = mailing.generateAddress();

          await app.navigationBar.changeTab('settings');
          await app.settings.settingsScreen.tapOnEmailNotifications();

          await app.settings.emailNotifications.configureNotificationsScreen.tapOnChangeEmailButton();
          await app.settings.emailNotifications.changeEmailScreen.typeEmail(newEmail);
          await app.settings.emailNotifications.changeEmailScreen.submit();

          const code = await mailing.getCode(newEmail, Subject.ADD_EMAIL);

          await app.settings.emailNotifications.confirmEmailAddressScreen.typeCode(code);
          await app.settings.emailNotifications.confirmEmailAddressScreen.submit();

          await expect(app.settings.emailNotifications.successScreen.icon).toBeVisible();
        });
      });

      describe('@ios @regression', () => {
        it('should be possible to change the email address and change wallets subscriptions', async () => {
          const newEmail = mailing.generateAddress();

          await steps.createWallet({
            emailAddress,
            name: 'wallet',
            type: WalletType.S_HD_P2SH,
          });

          await app.navigationBar.changeTab('settings');
          await app.settings.settingsScreen.tapOnEmailNotifications();

          await app.settings.emailNotifications.configureNotificationsScreen.tapOnChangeEmailButton();
          await app.settings.emailNotifications.changeEmailScreen.typeEmail(newEmail);
          await app.settings.emailNotifications.changeEmailScreen.submit();

          const code = await mailing.getCode(emailAddress, Subject.CHANGE_EMAIL);

          await app.settings.emailNotifications.verifyActionScreen.typeCode(code);
          await app.settings.emailNotifications.verifyActionScreen.submit();

          const secondCode = await mailing.getCode(newEmail, Subject.CHANGE_EMAIL);

          await app.settings.emailNotifications.verifyActionScreen.typeCode(secondCode);
          await app.settings.emailNotifications.verifyActionScreen.submit();
          await expect(app.settings.emailNotifications.successScreen.icon).toBeVisible();
        });
      });
    });

    describe('Remove email address', () => {
      let emailAddress: string;

      beforeEach(async () => {
        emailAddress = mailing.generateAddress();

        isBeta() && (await app.onboarding.betaVersionScreen.close());
        await app.developerRoom.typeEmailAddress(emailAddress);
        await app.developerRoom.tapOnSkipOnboardingWithEmailButton();
        await app.navigationBar.changeTab('settings');
      });

      describe('@ios @regression', () => {
        it('should be possible to remove the email address without having any wallets added', async () => {
          await app.settings.settingsScreen.tapOnEmailNotifications();

          await app.settings.emailNotifications.configureNotificationsScreen.tapOnDeleteEmailButton();
          await app.settings.emailNotifications.deleteScreen.confirm();

          await expect(app.settings.emailNotifications.successScreen.icon).toBeVisible();
        });

        it('should be possible to remove the email address and unsubscribe a wallet from notifications', async () => {
          const walletName = 'Goofy wallet';

          await steps.createWallet({
            type: WalletType.S_HD_P2SH,
            name: walletName,
            emailAddress,
          });

          await app.navigationBar.changeTab('settings');

          await app.settings.settingsScreen.tapOnEmailNotifications();

          await app.settings.emailNotifications.configureNotificationsScreen.tapOnDeleteEmailButton();
          await app.settings.emailNotifications.deleteScreen.confirm();

          await app.settings.emailNotifications.getNotificationsScreen.selectWallet(walletName);
          await app.settings.emailNotifications.getNotificationsScreen.tapOnConfirmButton();

          const code = await mailing.getCode(emailAddress, Subject.UNSUBSCRIBE);

          await app.settings.emailNotifications.verifyActionScreen.typeCode(code);
          await app.settings.emailNotifications.verifyActionScreen.submit();

          await expect(app.settings.emailNotifications.successScreen.icon).toBeVisible();
        });

        it("should be possible to remove the email address and not change the wallet's notifications", async () => {
          await steps.createWallet({
            type: WalletType.S_HD_P2SH,
            name: 'Goofy wallet',
            emailAddress,
          });

          await app.navigationBar.changeTab('settings');

          await app.settings.settingsScreen.tapOnEmailNotifications();

          await app.settings.emailNotifications.configureNotificationsScreen.tapOnDeleteEmailButton();
          await app.settings.emailNotifications.deleteScreen.confirm();

          await app.settings.emailNotifications.getNotificationsScreen.tapOnSkipButton();

          await expect(app.settings.emailNotifications.successScreen.icon).toBeVisible();
        });
      });
    });

    describe.skip('General', () => {
      describe('Without added email', () => {
        beforeEach(async () => {
          isBeta() && (await app.onboarding.betaVersionScreen.close());
          await app.developerRoom.tapOnSkipOnboardingButton();
          await app.onboarding.addEmailNotificationScreen.skip();
          await app.navigationBar.changeTab('settings');
        });

        describe('@android @ios @regression', () => {
          it('should be possible to resend the code', async () => {
            const email = mailing.generateAddress();

            await app.settings.settingsScreen.tapOnEmailNotifications();
            await app.settings.emailNotifications.noEmailAddedScreen.tapOnTapEmailButton();

            await app.settings.emailNotifications.addEmailAddressScreen.typeEmail(email);
            await app.settings.emailNotifications.addEmailAddressScreen.submit();

            await mailing.ignoreEmail(email);

            // NOTE: disabling synchronization because after tapping resend
            // some background process prevent detox from continuing the test
            await device.disableSynchronization();
            await app.settings.emailNotifications.confirmEmailAddressScreen.tapOnResendButton();

            const code = await mailing.getCode(email, Subject.ADD_EMAIL);

            jestExpect(code).toBeDefined();
          });

          it('should display an error message if typed email address is invalid ', async () => {
            await app.settings.settingsScreen.tapOnEmailNotifications();
            await app.settings.emailNotifications.noEmailAddedScreen.tapOnTapEmailButton();

            await app.settings.emailNotifications.addEmailAddressScreen.typeEmail('invalidemail.co');
            await app.settings.emailNotifications.addEmailAddressScreen.submit();

            await expect(app.settings.emailNotifications.addEmailAddressScreen.emailValidationError).toBeVisible();
          });

          it('should display an error message if typed code is invalid', async () => {
            const email = mailing.generateAddress();

            await app.settings.settingsScreen.tapOnEmailNotifications();
            await app.settings.emailNotifications.noEmailAddedScreen.tapOnTapEmailButton();

            await app.settings.emailNotifications.addEmailAddressScreen.typeEmail(email);
            await app.settings.emailNotifications.addEmailAddressScreen.submit();

            await app.settings.emailNotifications.confirmEmailAddressScreen.typeCode('1111');
          });

          it('should be displayed an error message and send a code if exceeded a limit of attempts of sending codes', async () => {
            const email = mailing.generateAddress();

            await app.settings.settingsScreen.tapOnEmailNotifications();
            await app.settings.emailNotifications.noEmailAddedScreen.tapOnTapEmailButton();

            await app.settings.emailNotifications.addEmailAddressScreen.typeEmail(email);
            await app.settings.emailNotifications.addEmailAddressScreen.submit();

            await mailing.ignoreEmail(email);

            await app.settings.emailNotifications.confirmEmailAddressScreen.typeCode('1111');
            await app.settings.emailNotifications.confirmEmailAddressScreen.submit();
            await app.settings.emailNotifications.confirmEmailAddressScreen.typeCode('2222');
            await app.settings.emailNotifications.confirmEmailAddressScreen.submit();
            await app.settings.emailNotifications.confirmEmailAddressScreen.typeCode('3333');
            await app.settings.emailNotifications.confirmEmailAddressScreen.submit();

            const code = await mailing.getCode(email, Subject.ADD_EMAIL);

            await expect(
              app.settings.emailNotifications.confirmEmailAddressScreen.pincodeValidationError,
            ).toBeVisible();
            jestExpect(code).toBeDefined();
          });
        });
      });

      describe('With added email', () => {
        let emailAddress: string;

        beforeEach(async () => {
          emailAddress = mailing.generateAddress();

          isBeta() && (await app.onboarding.betaVersionScreen.close());
          await app.developerRoom.typeEmailAddress(emailAddress);
          await app.developerRoom.tapOnSkipOnboardingWithEmailButton();
          await app.navigationBar.changeTab('settings');
        });

        describe('@ios @regression', () => {
          it('should be possible to get access to the wallet details from Email Notifications settings', async () => {
            const walletName = 'Goofy wallet';

            await steps.createWallet({
              type: WalletType.S_HD_P2SH,
              name: walletName,
              emailAddress,
            });

            await app.navigationBar.changeTab('settings');

            await app.settings.settingsScreen.tapOnEmailNotifications();
            await app.settings.emailNotifications.configureNotificationsScreen.tapOnWalletItem(walletName);

            await expect(app.walletDetails.mainScreen.walletName).toBeVisible();
          });
        });
      });
    });
  });
});
