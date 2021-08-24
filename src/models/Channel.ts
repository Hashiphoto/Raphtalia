class Channel {
  public id: string;
  public deleteMs: number;

  public constructor(id: string, deleteMs: number) {
    this.id = id;
    this.deleteMs = deleteMs;
  }
}

export default Channel;
