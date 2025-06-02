import testTransportLayer, { transportLayers } from "./helpers/transportLayers";
import linksFactory from "./factories/links";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);

  describe("Links", () => {
    // Test links on a single resource
    describe("GET single resource", () => {
      it("should include self link for a single resource", async () => {
        const result = await request.get(`/articles/1`);
        expect(result.status).toEqual(200);
        expect(result.body.data).toHaveProperty('links');
        expect(result.body.data.links).toEqual(linksFactory.singleArticle.data.links);
      });
    });

    // Test links on resource collections
    describe("GET resource collection", () => {
      it("should include collection self link", async () => {
        const result = await request.get(`/articles`);
        expect(result.status).toEqual(200);
        expect(result.body).toHaveProperty('links');
        expect(result.body.links).toEqual(linksFactory.articleCollection.links);
      });
    });

    // Test links in relationships
    describe("GET resource with relationships", () => {
      it("should include relationship links", async () => {
        const result = await request.get(`/articles/1`);
        expect(result.status).toEqual(200);

        // Check author relationship links
        expect(result.body.data.relationships.author).toHaveProperty('links');
        expect(result.body.data.relationships.author.links).toEqual(linksFactory.singleArticle.data.relationships.author.links);

        // Check votes relationship links
        expect(result.body.data.relationships.votes).toHaveProperty('links');
        expect(result.body.data.relationships.votes.links).toEqual(linksFactory.singleArticle.data.relationships.votes.links);
      });
    });

    // Test links for many-to-many relationships
    describe("GET many-to-many relationships", () => {
      it("should include links for many-to-many relationships", async () => {
        const result = await request.get(`/articles/1`);
        expect(result.status).toEqual(200);

        // Check tags relationship links
        expect(result.body.data.relationships.tags).toHaveProperty('links');
        expect(result.body.data.relationships.tags.links).toEqual(linksFactory.singleArticle.data.relationships.tags.links);

        // Check additional metadata for many-to-many relationships
        expect(result.body.data.relationships.tags).toHaveProperty('meta');
        expect(result.body.data.relationships.tags.meta).toEqual(linksFactory.singleArticle.data.relationships.tags.meta);
      });
    });

    // Test links when accessing a relationship directly
    describe("GET relationship endpoint", () => {
      it("should include links when accessing a relationship endpoint", async () => {
        const result = await request.get(`/articles/1/votes`);
        expect(result.status).toEqual(200);

        // Check top-level links
        expect(result.body).toHaveProperty('links');
        expect(result.body.links).toEqual(linksFactory.articleVotes.links);

        // Check that each related resource has a self link
        if (result.body.data.length > 0) {
          expect(Array.isArray(result.body.data)).toBeTruthy();
          result.body.data.forEach((vote, index) => {
            expect(vote).toHaveProperty('type', 'vote');
            expect(vote).toHaveProperty('links');
            expect(vote.links).toHaveProperty('self', `/vote/${vote.id}`);
          });
        }
      });
    });

    // Test links when accessing a relationship reference endpoint
    describe("GET relationship reference endpoint", () => {
      it("should include links when accessing a relationship reference endpoint", async () => {
        const result = await request.get(`/articles/1/relationships/votes`);
        expect(result.status).toEqual(200);

        // Check top-level links
        expect(result.body).toHaveProperty('links');
        expect(result.body.links).toEqual(linksFactory.articleVotesRelationship.links);

        // The response should be a linkage object (resource identifiers only)
        if (result.body.data.length > 0) {
          expect(Array.isArray(result.body.data)).toBeTruthy();
          result.body.data.forEach((identifier) => {
            expect(identifier).toHaveProperty('type', 'vote');
            expect(identifier).toHaveProperty('id');
            // Resource identifiers don't include links themselves
          });
        }
      });
    });
  });
});
