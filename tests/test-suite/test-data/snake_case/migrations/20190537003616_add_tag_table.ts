exports.up = async (knex) => {
  await knex.schema.createTable("tags", (table) => {
    table.increments("id").primary();
    table.string("name");
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTable("tags");
};
