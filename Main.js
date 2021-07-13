import React from 'react';
import { StatusBar } from 'react-native';

import App from './App';

const Main = () => {
  return (
    <>
      <StatusBar backgroundColor="rgba(0,0,0,0)" translucent />
      <App />
    </>
  );
};

export default Main;
