exports.up = async (knex) => {
  await knex.schema.createTable("articles_tags", (table) => {
    table.increments("id").primary();
    table.integer("article_id").notNullable().references("id").inTable("articles");
    table.integer("tag_id").notNullable().references("id").inTable("tags");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("articles_tags");
};
