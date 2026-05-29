import React, { ComponentType } from 'react';
import { View, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

const ReactNativeModal = (Modal as unknown) as ComponentType<any>;

interface Props {
  show: boolean;
  children: React.ReactNode;
}

export const CustomModal = ({ show, children }: Props) => {
  return (
    <View style={styles.container}>
      <ReactNativeModal isVisible={show}>
        <View style={styles.wrapper}>{children}</View>
      </ReactNativeModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrapper: { flex: 1, justifyContent: 'center' },
});
