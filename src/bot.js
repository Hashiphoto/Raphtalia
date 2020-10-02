import Raphtalia from "./Raphtalia.js";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";

dayjs.extend(duration);

const raphtalia = new Raphtalia();
raphtalia.configureDiscordClient();
