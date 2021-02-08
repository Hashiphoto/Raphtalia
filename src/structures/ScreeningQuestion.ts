import Question from "./Question";

export default class ScreeningQuestion extends Question {
  public id: string | undefined;

  public constructor(
    id?: string,
    prompt?: string,
    answer?: string,
    timeoutMs?: number,
    strict = false
  ) {
    super(prompt, answer, timeoutMs, strict);

    this.id = id;
  }

  public toString() {
    // Slice is to cut off the regexp (^...$) surrounding them
    return (
      `**ID: ${this.id}** | Time Limit: ${this.timeout}ms ` +
      `${this.strict ? " | strict" : ""}\n${this.prompt} \n` +
      `*${this.answer?.slice(1, this.answer.length - 1)}*\n\n`
    );
  }
}
