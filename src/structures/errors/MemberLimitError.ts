export default class MemberLimitError extends Error {
  private roleMemberLimit: number;

  public constructor(roleMemberLimit: number, ...params: any) {
    super(...params);

    this.name = "MemberLimitError";
    this.roleMemberLimit = roleMemberLimit;
  }
}
