import { AuthenticationAction } from '../../src/state/authentication/actions';
import { WalletsAction } from '../../src/state/wallets/actions';

const expectUniqueValues = actionTypes => {
  const values = Object.values(actionTypes);

  expect(new Set(values).size).toBe(values.length);
};

describe('action type contracts', () => {
  it('keeps authentication action values unique', () => {
    expectUniqueValues(AuthenticationAction);
  });

  it('keeps wallet action values unique', () => {
    expectUniqueValues(WalletsAction);
  });

  it('keeps refresh wallet failure distinct from send transaction failure', () => {
    expect(WalletsAction.RefreshWalletFailure).toBe('RefreshWalletFailure');
    expect(WalletsAction.SendTransactionFailure).toBe('SendTransactionFailure');
  });
});
