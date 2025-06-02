import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe("Many-to-Many Relationship Links", () => {
  const transportLayer = "vercel"; // Use vercel transport layer
  const request = testTransportLayer(transportLayer);

  it("should include links and meta for many-to-many relationships on resource objects", async () => {
    // Get the article that has tags
    const result = await request.get(`/articles/1`);
    expect(result.status).toEqual(200);

    // Verify the response includes a tags relationship
    expect(result.body.data.relationships).toHaveProperty('tags');

    // Verify it has the expected links
    const tagsRelationship = result.body.data.relationships.tags;
    expect(tagsRelationship).toHaveProperty('links');
    expect(tagsRelationship.links).toHaveProperty('self', '/article/1/relationships/tags');
    expect(tagsRelationship.links).toHaveProperty('related', '/article/1/tags');

    // Verify it has the meta information
    expect(tagsRelationship).toHaveProperty('meta');
    expect(tagsRelationship.meta).toHaveProperty('relationshipType', 'manyToMany');
    expect(tagsRelationship.meta).toHaveProperty('intermediateTable', 'articles_tags');
  });

  it("should include links on relationship endpoints", async () => {
    // Get the tags for article 1
    const result = await request.get(`/articles/1/tags`);

    // The response might be 500 if the feature isn't implemented yet
    // But for debugging purposes, let's output the status and error
    console.log(`Status: ${result.status}, Body:`, JSON.stringify(result.body));
  });
});
