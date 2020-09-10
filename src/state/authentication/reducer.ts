import { AuthenticationAction, AuthenticationActionType } from './actions';

export interface AuthenticationState {
  isPinSet: boolean;
  isTxPasswordSet: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
}

const initialState: AuthenticationState = {
  isTxPasswordSet: false,
  isPinSet: false,
  isAuthenticated: false,
  isLoading: true,
  error: '',
};

export const authenticationReducer = (state = initialState, action: AuthenticationActionType): AuthenticationState => {
  switch (action.type) {
    case AuthenticationAction.SetIsAuthenticated:
      return {
        ...state,
        isAuthenticated: action.isAuthenticated,
      };
    case AuthenticationAction.CheckCredentialsRequest:
      return {
        ...state,
        isLoading: true,
      };
    case AuthenticationAction.AuthenticateSuccess:
      return {
        ...state,
        error: '',
        isAuthenticated: true,
        isLoading: false,
      };
    case AuthenticationAction.CheckCredentialsSuccess:
      return {
        ...state,
        error: '',
        isPinSet: action.isPinSet,
        isTxPasswordSet: action.isTxPasswordSet,
        isLoading: false,
      };
    case AuthenticationAction.CreatePinSuccess:
      return {
        ...state,
        error: '',
        isPinSet: true,
      };
    case AuthenticationAction.CreateTxPasswordSuccess:
      return {
        ...state,
        error: '',
        isTxPasswordSet: true,
        isAuthenticated: true,
      };
    case AuthenticationAction.CheckCredentialsFailure:
    case AuthenticationAction.AuthenticateFailure:
    case AuthenticationAction.CreatePinFailure:
      return {
        ...state,
        isAuthenticated: false,
        error: action.error,
        isLoading: false,
      };
    default:
      return state;
  }
};
