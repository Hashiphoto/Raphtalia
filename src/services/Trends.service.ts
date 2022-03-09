import GoogleTrends, { InterestOverTimeResult } from "google-trends-api";

import dayjs from "dayjs";
import { injectable } from "tsyringe";

@injectable()
export default class TrendsService {
  // public constructor() {}

  public async getInterestOverTime(
    keywords: string[],
    days: number
  ): Promise<InterestOverTimeResult> {
    const stringResult = await GoogleTrends.interestOverTime({
      keyword: keywords,
      startTime: dayjs().subtract(days, "days").toDate(),
    });
    const result = JSON.parse(stringResult);
    return result;
  }
}
