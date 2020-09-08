class TestCensorController {
  rebuildCensorshipList() {}

  censorMessage() {}

  deleteWords(words) {
    this.deletedWords = words;
    return Promise.resolve();
  }

  insertWords(words) {
    this.insertedWords = words;
    return Promise.resolve();
  }

  getAllBannedWords() {}
}

export default TestCensorController;
