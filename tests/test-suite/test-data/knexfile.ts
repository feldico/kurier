// Update with your config settings.
import { join } from "path";

export default {
  test_snake_case: {
    client: "better-sqlite3",
    connection: {
      filename: join(__dirname, "snake_case", "test.sqlite3"),
    },
    esm: true,
    extension: "ts",
    useNullAsDefault: true,
    seeds: {
      directory: join(__dirname, "snake_case", "seeds"),
    },
    migrations: {
      directory: join(__dirname, "snake_case", "migrations"),
    },
  },
  test_camelCase: {
    client: "better-sqlite3",
    connection: {
      filename: join(__dirname, "camelCase", "test.sqlite3"),
    },
    esm: true,
    extension: "ts",
    useNullAsDefault: true,
    seeds: {
      directory: join(__dirname, "camelCase", "seeds"),
    },
    migrations: {
      directory: join(__dirname, "camelCase", "migrations"),
    },
  },
};
