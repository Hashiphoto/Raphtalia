class TestMemberController {
  addInfractions() {
    return Promise.resolve();
  }

  setInfractions() {
    return Promise.resolve();
  }

  getInfractions() {
    return Promise.resolve();
  }

  checkInfractionCount() {
    return Promise.resolve();
  }

  softKick() {
    return Promise.resolve();
  }

  getNextRole() {
    return Promise.resolve();
  }

  getPreviousRole() {
    return Promise.resolve();
  }

  pardonMember() {
    return Promise.resolve();
  }

  releaseFromExile() {
    return Promise.resolve();
  }

  exileMember(member, exileTime) {
    this.exileDuration = exileTime;

    return Promise.resolve(exileTime != null);
  }

  hasRole() {
    return Promise.resolve();
  }

  hasRoleOrHigher() {
    return Promise.resolve();
  }

  setHoistedRole() {
    return Promise.resolve();
  }

  addRoles() {
    return Promise.resolve();
  }

  promoteMember() {
    return Promise.resolve();
  }

  demoteMember(member) {
    return Promise.resolve(`testing text: ${member.toString()} has been demoted\n`);
  }
}

export default TestMemberController;
