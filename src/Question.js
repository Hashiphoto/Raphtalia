class Question {
  prompt;
  answer;
  timeout;

  constructor(prompt, answer, timeoutMs) {
    this.prompt = prompt;
    this.answer = answer;
    this.timeout = timeoutMs;
  }
}

export default Question;
