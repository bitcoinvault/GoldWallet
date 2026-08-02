import { Transaction } from 'app/consts';
import { formatDate } from 'app/helpers/date';
import { getGroupedTransactions } from 'app/helpers/transactions';

const transaction = (hash: string, received: string) =>
  ({
    hash,
    txid: hash,
    received,
  }) as Transaction;

describe('getGroupedTransactions', () => {
  it('orders transactions newest first and groups them by received date', () => {
    const older = transaction('older', '2026-01-01T12:00:00.000Z');
    const newerSameDay = transaction('newer-same-day', '2026-01-02T12:00:00.000Z');
    const newest = transaction('newest', '2026-01-02T13:00:00.000Z');

    expect(getGroupedTransactions([older, newerSameDay, newest])).toEqual([
      {
        title: formatDate(newest.received, 'll'),
        data: [newest, newerSameDay],
      },
      {
        title: formatDate(older.received, 'll'),
        data: [older],
      },
    ]);
  });
});
