import { groupBy, orderBy, map, compose } from 'lodash/fp';

import { Transaction } from 'app/consts';
import { formatDate } from 'app/helpers/date';

// @ts-expect-error - lodash/fp map.convert is still missing from @types/lodash 4.17.25.
const mapNoCap = map.convert({ cap: false });

type FP = (...args: any[]) => any;
type TransactionGroup<T extends Transaction> = { title: string; data: T[] };

export const getGroupedTransactions = <T extends Transaction>(transactions: T[], ...fps: FP[]) =>
  compose(
    mapNoCap((txs: T[], date: string) => ({
      title: date,
      data: txs,
    })),
    groupBy(({ received }) => formatDate(received, 'll')),
    orderBy(['received'], ['desc']),
    ...fps,
  )(transactions) as TransactionGroup<T>[];
