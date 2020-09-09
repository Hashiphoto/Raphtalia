class TestCensorController {
  setBanList(list) {
    this.banList = list;
  }

  rebuildCensorshipList() {}

  censorMessage() {}

  deleteWords(words) {
    this.deletedWords = words;
    return Promise.resolve(this.deletedWords);
  }

  insertWords(words) {
    this.insertedWords = words;
    return Promise.resolve(this.insertedWords);
  }

  getAllBannedWords() {
    return Promise.resolve(this.banList);
  }
}

export default TestCensorController;
