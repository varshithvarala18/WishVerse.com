/** Error with a message that is safe and friendly to show in a toast. */
export class StorageError extends Error {
  constructor(message, { cause, quota = false } = {}) {
    super(message);
    this.name = 'StorageError';
    this.quota = quota;
    if (cause) this.cause = cause;
  }
}

export function isQuotaError(err) {
  if (!err) return false;
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    err.code === 1014 ||
    (err.inner && isQuotaError(err.inner))
  );
}

export function toStorageError(err, what = 'your data') {
  if (err instanceof StorageError) return err;
  if (isQuotaError(err)) {
    return new StorageError(
      'Your browser storage is full 😕 Remove a few photos/videos or delete an old surprise, then try again.',
      { cause: err, quota: true }
    );
  }
  return new StorageError(`Couldn't save ${what} in this browser. Private/incognito mode may block storage.`, {
    cause: err,
  });
}

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;
  if (err instanceof StorageError) return err.message;
  if (typeof err === 'string') return err;
  return err.message || fallback;
}
