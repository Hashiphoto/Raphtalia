class TestMemberController {
  addInfractions() {
    return Promise.resolve();
  }

  setInfractions() {}

  getInfractions() {}

  checkInfractionCount() {}

  softKick() {}

  getNextRole() {}

  getPreviousRole() {}

  pardonMember() {}

  releaseFromExile() {}

  exileMember() {}

  hasRole() {}

  hasRoleOrHigher() {}

  setHoistedRole() {}

  addRoles() {}

  promoteMember() {}

  demoteMember(member) {
    return Promise.resolve(`testing text: ${member} has been demoted\n`);
  }
}

export default TestMemberController;
