import { FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import Repository from "./Repository";
import ScreeningQuestion from "../models/ScreeningQuestion";

export default class ScreeningQuestionRepository extends Repository {
  public async getScreeningQuestions(guildId: string): Promise<ScreeningQuestion[]> {
    return this.pool
      .query("SELECT * FROM screening_questions WHERE guild_id=?", [guildId])
      .then(([rows]: [RowDataPacket[], FieldPacket[]]) => {
        return rows.map((r) => this.toScreeningQuestion(r));
      });
  }

  public async insertScreeningQuestion(
    guildId: string,
    question: ScreeningQuestion
  ): Promise<void> {
    await this.pool.query(
      "INSERT INTO screening_questions (guild_id, prompt, answer, timeout_ms, strict) VALUES(?,?,?,?,?)",
      [guildId, question.prompt, question.answer, question.timeout, question.strict]
    );
  }

  public async deleteScreeningQuestion(guildId: string, questionId: number): Promise<boolean> {
    return this.pool
      .query("DELETE FROM screening_questions WHERE guild_id=? AND id=?", [guildId, questionId])
      .then(([header]: [ResultSetHeader, FieldPacket[]]) => {
        return header.affectedRows > 0;
      });
  }

  private toScreeningQuestion(dbRow: RowDataPacket) {
    return new ScreeningQuestion(
      dbRow.id,
      dbRow.prompt,
      dbRow.answer,
      dbRow.timeout_ms,
      dbRow.strict
    );
  }
}
