// Cache only records the user has opened. Failed requests remain retryable.
export function createLazyRecords() {
  const requests = new Map();
  return {
    load(key, fetchRecords) {
      if (!requests.has(key)) {
        const request = Promise.resolve().then(fetchRecords).catch((error) => {
          if (requests.get(key) === request) requests.delete(key);
          throw error;
        });
        requests.set(key, request);
      }
      return requests.get(key);
    },
  };
}
