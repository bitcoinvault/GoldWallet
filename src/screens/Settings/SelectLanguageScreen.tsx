import React from 'react';
import { Text, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

import { icons } from 'app/assets';
import { ScreenTemplate, Header, Image } from 'app/components';
import { selectors } from 'app/state/appSettings';
import { updateSelectedLanguage } from 'app/state/appSettings/actions';
import { typography } from 'app/styles';

const i18n = require('../../../loc');

export interface Language {
  label: string;
  value: string;
}

interface LanguageItemProps {
  testID: string;
  selectedLanguage: Language;
  selectedLanguageValue: string;
  onLanguageSelect: (value: string) => void;
}

const LanguageItem = (props: LanguageItemProps) => {
  const { testID, selectedLanguage, selectedLanguageValue, onLanguageSelect } = props;

  const handleLanguageSelect = () => onLanguageSelect(selectedLanguage.value);

  return (
    <TouchableOpacity
      testID={testID}
      key={selectedLanguage.value}
      onPress={handleLanguageSelect}
      style={styles.langaugeItemContainer}
    >
      <Text style={styles.languageItem}>{selectedLanguage.label}</Text>
      {selectedLanguage.value === selectedLanguageValue && (
        <View style={styles.successImageContainer}>
          <Image source={icons.success} style={styles.successImage} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export const SelectLanguageScreen = () => {
  const language = useSelector(selectors.language);
  const dispatch = useDispatch();

  const availableLanguages: Language[] = [
    { label: 'English (EN)', value: 'en' },
    { label: '中文 (ZH)', value: 'zh' },
    { label: 'Español (ES)', value: 'es' },
    { label: 'Indonesian (ID)', value: 'id' },
    { label: '日本語 (JP)', value: 'ja' },
    { label: '한국어 (KO)', value: 'ko' },
    { label: 'Português (PT)', value: 'pt' },
    { label: 'Tiếng (Việt)', value: 'vi' },
    { label: 'Türkçe (TR)', value: 'tr' },
  ];

  const onLanguageSelect = (value: string) => {
    Alert.alert(
      i18n.selectLanguage.confirmation,
      i18n.selectLanguage.alertDescription,
      [
        {
          text: i18n.selectLanguage.confirm,
          onPress: async () => {
            await i18n.saveLanguage(value);
            dispatch(updateSelectedLanguage(value));
          },
        },
        {
          text: i18n.selectLanguage.cancel,
          style: 'cancel',
        },
      ],
      { cancelable: false },
    );
  };

  return (
    <ScreenTemplate header={<Header isBackArrow={true} title={i18n.selectLanguage.header} />}>
      {availableLanguages.map(item => (
        <LanguageItem
          testID={`language-item-${item.value}`}
          selectedLanguage={item}
          selectedLanguageValue={language}
          onLanguageSelect={onLanguageSelect}
          key={item.value}
        />
      ))}
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  languageItem: {
    ...typography.caption,
    width: '100%',
  },
  langaugeItemContainer: {
    marginVertical: 8,
    flexDirection: 'row',
  },
  successImageContainer: {
    width: 21,
    height: 21,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 20,
  },
  successImage: {
    width: 15,
    height: 11,
  },
});
