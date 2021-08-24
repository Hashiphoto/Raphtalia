export default () => {
  switch (process.env.NODE_ENV) {
    case "prod":
      return {
        discord: {
          token: "Njc5MTYwMDM2NjA1Mjk2Njcx.XktTEg.vhzCKEfDZSTh5CMFeVQiZkufgK8",
        },
        database: {
          host: "localhost",
          port: 3306,
          user: "botadmin",
          password: "2complex4u",
          database: "raphtalia",
        },
      };

    case "test":
      return {
        discord: {
          token: "Njc5MTYwMDM2NjA1Mjk2Njcx.XktTEg.vhzCKEfDZSTh5CMFeVQiZkufgK8",
        },
        database: {
          host: "localhost",
          port: 33306,
          user: "botadmin",
          password: "2complex4u",
          database: "raphtalia",
        },
        ssh: "47.25.165.160",
      };
    default:
      return {
        discord: {
          token: "Njc5OTM4MTIyMTgzODY4NDM1.Xk4nuA.q_f4eof6ymqVv9kQaWi54z39_uc",
        },
        database: {
          host: "localhost",
          port: 33306,
          user: "botadmin",
          password: "2complex4u",
          database: "raphtaliaDev",
        },
        ssh: "47.25.165.160",
      };
  }
};
