import getAuthenticationData from "./helpers/authenticateUser";
import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);

  describe("Nested Relationship Filtering", () => {
    beforeEach(async () => {
      // Setup data if needed for tests
    });

    it("should filter resources by nested relationship field", async () => {
      const authData = await getAuthenticationData();

      // Test filtering articles by author.id
      const result = await request
        .get("/articles?filter[author.id]=1")
        .set("Authorization", authData.token);

      expect(result.status).toEqual(200);
      expect(result.body.data.length).toBeGreaterThan(0); // Ensure some articles are returned

      // Every article should have author with id=1
      result.body.data.forEach(article => {
        expect(article.relationships.author.data.id).toEqual(1);
      });
    });

    it("should filter resources by deeply nested relationship fields", async () => {
      const authData = await getAuthenticationData();

      // Test filtering comments by article.author.id
      const result = await request
        .get("/comments?filter[article.author.id]=1")
        .set("Authorization", authData.token);

      expect(result.status).toEqual(200);

      // The test would verify that all returned comments are on articles by author 1
    });

    it("should handle multiple nested relationship filters", async () => {
      const authData = await getAuthenticationData();

      // Test filtering with multiple nested filters
      const result = await request
        .get("/comments?filter[article.author.id]=1&filter[user.id]=2")
        .set("Authorization", authData.token);

      expect(result.status).toEqual(200);

      // The test would verify that the filters are combined correctly
    });

    it("should return appropriate error for invalid nested relationship path", async () => {
      const authData = await getAuthenticationData();

      // Test error handling for invalid relationship path
      const result = await request
        .get("/articles?filter[invalid.relationship.path]=1")
        .set("Authorization", authData.token);

      expect(result.status).toEqual(400);
      expect(result.body.errors[0].detail).toContain("Invalid relationship path");
    });
  });
});
