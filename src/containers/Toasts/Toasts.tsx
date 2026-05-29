import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Dispatch } from 'redux';

import { CustomToast } from 'app/components';
import { Toast } from 'app/consts';
import { selectors, actions } from 'app/state/toastMessages';

interface Props {
  onClick?: (id: string) => void;
}

export const Toasts = ({ onClick }: Props) => {
  const toastMessages = useSelector(selectors.toastMessages);
  const dispatch = useDispatch<Dispatch<any>>();

  const handleClick = (toast: Toast) => {
    onClick && onClick(toast.id);
    dispatch(actions.hideToastMessage(toast));
  };

  return (
    <View style={styles.outerContainer}>
      {toastMessages.map(toast => (
        <Pressable key={toast.id} onPress={() => handleClick(toast)}>
          <CustomToast toast={toast} onClose={() => dispatch(actions.hideToastMessage(toast))} />
        </Pressable>
      ))}
    </View>
  );
};

export default Toasts;

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
  },
});
