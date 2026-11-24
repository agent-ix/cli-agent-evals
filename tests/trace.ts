// trace() names the acceptance criteria a test checks. It does nothing when
// the test runs; quire reads the calls from the source.
export const trace = (...ids: string[]): void => {
  void ids;
};
