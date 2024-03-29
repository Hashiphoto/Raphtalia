export default class Question {
  public prompt: string | undefined;
  public answer: string;
  public timeout: number | undefined;
  public strict: boolean;

  /**
   * @param {String} prompt The question to be asked
   * @param {String} answer The string representation of a regular expression that matches the accepted answer
   * @param {Number} timeoutMs How many milliseconds they have to answer the question
   * @param {Boolean} strict In strict mode, they only get one chance to answer correctly
   */
  public constructor(prompt?: string, answer = ".*", timeoutMs?: number, strict = false) {
    this.prompt = prompt;
    this.answer = answer;
    this.timeout = timeoutMs;
    this.strict = strict;
  }
}
