import { BelongsTo, HasMany, Resource } from "../kurier";
import Tag from "./tag";
import User from "./user";
import Vote from "./vote";

export default class Article extends Resource {
  static schema = {
    attributes: {
      body: String,
    },

    relationships: {
      author: BelongsTo(User, { foreignKeyName: "author" }),
      votes: HasMany(Vote, { foreignKeyName: "article_id" }),
      tags: {
        type: () => Tag,
        manyToMany: true,
        intermediateTable: "articles_tags"
      },
    },
  };
}
