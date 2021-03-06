export default () => {
  switch (process.env.NODE_ENV) {
    case "prod":
      return {
        roles: {
          leader: "418672465322049546",
          gov: "644981731618717698",
          neutral: "418672604560359424",
          exile: "675505272956911623",
          immigrant: "691493749737390120",
          voter: "voter",
        },
        channels: {
          welcomeChannelId: "691436093945544834",
          generalChannelId: "507445400236720128",
        },
      };
    default:
      return {
        roles: {
          leader: "685253374056464401",
          gov: "677675847120977935",
          neutral: "681033553877925950",
          exile: "679860490599399493",
          immigrant: "684893450302128182",
          voter: "voter",
        },
        channels: {
          welcomeChannelId: "684893729508818997",
          generalChannelId: "677378023259111438",
        },
      };
  }
};
