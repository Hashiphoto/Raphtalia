import Question from "./Question.js";

class ScreeningQuestion extends Question {
  constructor(id, prompt, answer, timeoutMs, strict = false) {
    super(prompt, answer, timeoutMs, strict);

    this.id = id;
  }

  toString() {
    // Slice is to cut off the regexp (^...$) surrounding them
    return (
      `**ID: ${this.id}** | Time Limit: ${this.timeout}ms ` +
      `${this.strict ? " | strict" : ""}\n${this.prompt} \n` +
      `*${this.answer.slice(1, this.answer.length - 1)}*\n\n`
    );
  }
}

export default ScreeningQuestion;
