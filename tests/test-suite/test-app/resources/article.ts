import { Resource } from "../kurier";
import Tag from "./tag";
import User from "./user";
import Vote from "./vote";

export default class Article extends Resource {
  static schema = {
    attributes: {
      body: String,
    },

    relationships: {
      author: {
        type: () => User,
        belongsTo: true,
        foreignKeyName: "author",
      },
      votes: {
        type: () => Vote,
        hasMany: true,
      },
      tags: {
        type: () => Tag,
        manyToMany: true,
        intermediateTable: "articles_tags"
      },
    },
  };
}
