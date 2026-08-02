import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);

  describe("Many-to-Many Relationships", () => {
    // Test fetching a resource with many-to-many relationships
    describe("GET resource with many-to-many relationship", () => {
      it("should include proper links and metadata for many-to-many relationships", async () => {
        const result = await request.get(`/articles/1`);
        expect(result.status).toEqual(200);

        // Ensure the resource has the tags relationship
        expect(result.body.data.relationships).toHaveProperty('tags');

        // Verify links are present
        expect(result.body.data.relationships.tags).toHaveProperty('links');
        expect(result.body.data.relationships.tags.links).toHaveProperty('self', '/article/1/relationships/tags');
        expect(result.body.data.relationships.tags.links).toHaveProperty('related', '/article/1/tags');

        // Verify metadata for many-to-many is included
        expect(result.body.data.relationships.tags).toHaveProperty('meta');
        expect(result.body.data.relationships.tags.meta).toHaveProperty('relationshipType', 'manyToMany');
        expect(result.body.data.relationships.tags.meta).toHaveProperty('intermediateTable', 'articles_tags');
      });
    });

    // Test accessing the many-to-many relationship directly
    describe("GET many-to-many relationship endpoint", () => {
      it("should include links when accessing a many-to-many relationship", async () => {
        const result = await request.get(`/articles/1/tags`);
        expect(result.status).toEqual(200);

        // Verify top-level links are present
        expect(result.body).toHaveProperty('links');
        expect(result.body.links).toHaveProperty('self', '/article/1/tags');
      });
    });

    // Test accessing the many-to-many relationship reference
    describe("GET many-to-many relationship reference endpoint", () => {
      it("should include links when accessing a many-to-many relationship reference", async () => {
        const result = await request.get(`/articles/1/relationships/tags`);
        expect(result.status).toEqual(200);

        // Verify top-level links are present
        expect(result.body).toHaveProperty('links');
        expect(result.body.links).toHaveProperty('self', '/article/1/relationships/tags');
        expect(result.body.links).toHaveProperty('related', '/article/1/tags');
      });
    });
  });
});
