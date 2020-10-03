import Question from "./Question.js";

class ScreeningQuestion extends Question {
  constructor(id, prompt, answer, timeoutMs, strict = false) {
    super(prompt, answer, timeoutMs, strict);

    this.id = id;
  }

  toString() {
    return `**ID: ${this.id}** | Time Limit: ${this.timeout}ms ${this.strict ? " | strict" : ""}\n${
      this.prompt
    } \n*${this.answer}*\n\n`;
  }
}

export default ScreeningQuestion;
