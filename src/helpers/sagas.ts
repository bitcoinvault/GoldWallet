import { call, fork, cancel, take } from 'redux-saga/effects';

export function takeLatestPerKey(
  patternOrChannel: string,
  worker: any,
  keySelector: (...args: any[]) => any,
  ...args: any[]
) {
  return fork(function* () {
    const tasks: Record<string, any> = {};

    while (true) {
      const action: string = yield take(patternOrChannel);
      const key: string = yield call(keySelector, action);

      if (tasks[key]) {
        yield cancel(tasks[key]);
      }

      tasks[key] = yield fork(worker, ...args, action);
    }
  });
}
