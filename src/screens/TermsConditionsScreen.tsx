import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import RNExitApp from 'react-native-exit-app';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';

import { en, zh, es, id, pt, jp, ko, tr, vi } from 'app/assets/tc/';
import { Button, CustomModal, Header, ScreenTemplate, CheckBox } from 'app/components';
import { ApplicationState } from 'app/state';
import { selectors as appSettingsSelectors } from 'app/state/appSettings';
import { selectors as authenticationSelectors } from 'app/state/authentication';
import { createTc as createTcAction } from 'app/state/authentication/actions';
import { fonts, palette, typography } from 'app/styles';

const i18n = require('../../loc');

interface MapStateToProps {
  isPinSet: boolean;
  isTxPasswordSet: boolean;
  language: string;
}

interface Props {
  createTc: () => void;
  isPinSet: boolean;
  isTcAccepted?: boolean;
  isTxPasswordSet: boolean;
  language: string;
}

interface State {
  showWarring: boolean;
  isWebViewLoaded: boolean;
  agreedToTermsAndConditions: boolean;
  agreedToPrivacyPolicy: boolean;
}

export class TermsConditionsScreen extends React.PureComponent<Props, State> {
  state = {
    showWarring: false,
    isWebViewLoaded: false,
    agreedToTermsAndConditions: false,
    agreedToPrivacyPolicy: false,
  };

  toggleAgreementToTermsAndConditions = () => {
    const { agreedToTermsAndConditions } = this.state;

    this.setState({ agreedToTermsAndConditions: !agreedToTermsAndConditions });
  };

  toggleAgreementToPrivacyPolicy = () => {
    const { agreedToPrivacyPolicy } = this.state;

    this.setState({ agreedToPrivacyPolicy: !agreedToPrivacyPolicy });
  };

  handleNoButton = () => {
    this.toggleModal();
  };

  handleYesButton = () => {
    RNExitApp.exitApp();
  };

  toggleModal = () => {
    this.setState({
      showWarring: !this.state.showWarring,
    });
  };

  disagreeAction = () => {
    this.toggleModal();
  };

  agreeAction = () => {
    const { createTc } = this.props;

    createTc();
  };

  get langVersion() {
    const { language } = this.props;

    switch (language) {
      case 'zh':
        return zh;
      case 'es':
        return es;
      case 'pt':
        return pt;
      case 'ja':
        return jp;
      case 'id':
        return id;
      case 'tr':
        return tr;
      case 'vi':
        return vi;
      case 'ko':
        return ko;
      default:
        return en;
    }
  }

  get termsHtml() {
    return this.langVersion.replace(/\s*<link[^>]+fonts\.g(?:oogleapis|static)\.com[^>]*>/g, '');
  }

  renderContent = () => {
    return (
      <View style={styles.content}>
        <Text style={styles.modalTitle}>{i18n.termsConditions.modal.header}</Text>
        <Text style={styles.modalText}>{i18n.termsConditions.modal.text}</Text>
        <View style={styles.buttonWrapper}>
          <TouchableOpacity onPress={this.handleNoButton}>
            <Text style={styles.modalButton} testID="modal-no">
              {`${i18n.termsConditions.modal.noButton}`.toUpperCase()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.handleYesButton}>
            <Text style={styles.modalButton} testID="modal-yes">
              {`${i18n.termsConditions.modal.yesButton}`.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  get canAgree() {
    const { agreedToTermsAndConditions, agreedToPrivacyPolicy } = this.state;

    return agreedToTermsAndConditions && agreedToPrivacyPolicy;
  }

  render() {
    const { showWarring, agreedToTermsAndConditions, agreedToPrivacyPolicy } = this.state;

    return (
      <ScreenTemplate
        testID={'terms-conditions-screen'}
        contentContainer={styles.scrollContent}
        footer={
          <View style={styles.buttonContainer}>
            <Button
              title={i18n.termsConditions.buttons.disagree}
              onPress={this.disagreeAction}
              type="outline"
              testID="disagree-button"
              containerStyle={styles.disagreeButton}
            />
            <Button
              title={i18n.termsConditions.buttons.agree}
              onPress={this.agreeAction}
              testID="agree-button"
              containerStyle={styles.agreeButton}
              disabled={!this.canAgree}
            />
          </View>
        }
        header={<Header title={i18n.termsConditions.header} />}
      >
        <Text style={styles.title} testID="terms-and-conditions-title">
          {i18n.termsConditions.title}
        </Text>
        <WebView
          source={{ html: this.termsHtml }}
          style={styles.text}
          originWhitelist={['*']}
          javaScriptEnabled={false}
          bounces={false}
          scrollEnabled
          automaticallyAdjustContentInsets={true}
          contentInset={{ top: 0, left: 0 }}
          onLoad={() => {
            this.setState({ isWebViewLoaded: true });
          }}
          onShouldStartLoadWithRequest={event => {
            if (!/^[data:text, about:blank]/.test(event.url)) {
              Linking.openURL(event.url);
              return false;
            }
            return true;
          }}
        />
        {this.state.isWebViewLoaded && (
          <>
            <CheckBox
              onPress={this.toggleAgreementToTermsAndConditions}
              containerStyle={styles.checkbox}
              left
              testID="terms-and-conditions-checkbox"
              checked={agreedToTermsAndConditions}
              title={<Text style={styles.checkboxText}>{i18n.termsConditions.readTermsConditions}</Text>}
            />
            <CheckBox
              onPress={this.toggleAgreementToPrivacyPolicy}
              containerStyle={styles.checkbox}
              testID="privacy-policy-checkbox"
              left
              checked={agreedToPrivacyPolicy}
              title={<Text style={styles.checkboxText}>{i18n.termsConditions.readPrivacyPolicy}</Text>}
            />
          </>
        )}

        <CustomModal show={showWarring}>{this.renderContent()}</CustomModal>
      </ScreenTemplate>
    );
  }
}

const mapStateToProps = (state: ApplicationState): MapStateToProps => ({
  isPinSet: authenticationSelectors.isPinSet(state),
  isTxPasswordSet: authenticationSelectors.isTxPasswordSet(state),
  language: appSettingsSelectors.language(state),
});

const mapDispatchToProps = {
  createTc: createTcAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(TermsConditionsScreen);

const styles = StyleSheet.create({
  title: {
    ...typography.headline4,
    marginTop: 16,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 180,
  },
  checkbox: {
    marginLeft: 0,
    backgroundColor: palette.white,
    borderWidth: 0,
  },
  checkboxText: {
    ...typography.headline5,
    marginLeft: 12,
  },
  text: {
    height: 430,
    marginTop: 25,
    paddingBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '50%',
    paddingTop: 13,
  },
  disagreeButton: {
    paddingRight: 10,
    width: '100%',
  },
  agreeButton: {
    paddingLeft: 10,
    width: '100%',
  },
  content: {
    backgroundColor: palette.background,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    borderRadius: 4,
    borderColor: palette.textBlack,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.ubuntu.bold,
    marginTop: 16,
    marginHorizontal: 23,
  },
  modalText: {
    fontFamily: fonts.ubuntu.regular,
    fontSize: 15,
    lineHeight: 22.5,
    color: palette.textGrey,
    marginHorizontal: 23,
    marginTop: 10,
  },
  buttonWrapper: {
    paddingTop: 15,
    alignSelf: 'flex-end',
  },
  modalButton: {
    ...typography.button,
    paddingVertical: 10,
    textAlign: 'right',
    color: palette.secondary,
    marginHorizontal: 23,
  },
});
