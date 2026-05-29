import { applyMiddleware, compose, createStore, Middleware, Store } from 'redux';
import { persistStore } from 'redux-persist';
import reduxReset from 'redux-reset';
import createSagaMiddleware from 'redux-saga';

import { persistedReducer, ApplicationState, rootSaga } from '.';

const sagaMiddleware = createSagaMiddleware();

const middlewares: Middleware[] = [sagaMiddleware as Middleware];

function bindMiddleware(middleware: Middleware[]) {
  if (__DEV__) {
    const composeEnhancers = (global as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
    const createDebugger = require('redux-flipper').default;

    middleware.push(createDebugger());

    return composeEnhancers(applyMiddleware(...middleware), reduxReset());
  }

  return compose(applyMiddleware(...middlewares), reduxReset());
}

const configureStore = (): Store<ApplicationState> => createStore(persistedReducer, bindMiddleware(middlewares));

export const store = configureStore();
export const runSaga = () => sagaMiddleware.run(rootSaga);
runSaga();

export const persistor = persistStore(store);
