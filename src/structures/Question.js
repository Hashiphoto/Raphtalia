class Question {
  prompt;
  answer;
  timeout;
  strict;

  constructor(prompt, answer, timeoutMs, strict = false) {
    this.prompt = prompt;
    this.answer = answer;
    this.timeout = timeoutMs;
    this.strict = strict;
  }
}

export default Question;
