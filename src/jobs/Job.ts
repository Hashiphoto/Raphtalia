export default interface Job {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run(...params: any): Promise<void>;
}
