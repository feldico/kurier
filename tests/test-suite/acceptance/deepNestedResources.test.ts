import getAuthenticationData from "./helpers/authenticateUser";
import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);

  describe("Deep Nested Resources", () => {
    describe("GET", () => {
      it("should include deep nested relationships with 3 levels", async () => {
        const authData = await getAuthenticationData();
        // This includes a deep nested path: comment -> parentComment -> author -> articles
        const result = await request
          .get("/comment/1?include=parentComment.author.articles")
          .set("Authorization", authData.token);

        expect(result.status).toEqual(200);

        // Verify the comment is returned
        expect(result.body.data).toHaveProperty('id', '1');
        expect(result.body.data).toHaveProperty('type', 'comment');

        // Verify included resources contain the parent comment
        const parentComment = result.body.included.find(
          resource => resource.type === 'comment' && resource.id === '2'
        );
        expect(parentComment).toBeDefined();

        // Verify included resources contain the author
        const author = result.body.included.find(
          resource => resource.type === 'user' && resource.id === '2'
        );
        expect(author).toBeDefined();

        // Verify included resources contain the author's articles
        const articles = result.body.included.filter(
          resource => resource.type === 'article'
        );
        expect(articles.length).toBeGreaterThan(0);
      });

      it("should include multiple deep nested relationships", async () => {
        const authData = await getAuthenticationData();
        // Include two deep paths
        const result = await request
          .get("/comment/1?include=parentComment.author.articles,parentComment.author.votes")
          .set("Authorization", authData.token);

        expect(result.status).toEqual(200);

        // Verify the comment is returned
        expect(result.body.data).toHaveProperty('id', '1');

        // Verify included resources contain the parent comment's author's articles
        const articles = result.body.included.filter(
          resource => resource.type === 'article'
        );
        expect(articles.length).toBeGreaterThan(0);

        // Verify included resources contain the parent comment's author's votes
        const votes = result.body.included.filter(
          resource => resource.type === 'vote'
        );
        expect(votes.length).toBeGreaterThan(0);
      });

      it("should allow accessing specific attributes in deeply nested resources", async () => {
        const authData = await getAuthenticationData();
        // Include fields in the request to specify which attributes to include
        const result = await request
          .get("/comment/1?include=parentComment.author.articles&fields[article]=body,voteCount")
          .set("Authorization", authData.token);

        expect(result.status).toEqual(200);

        // Find an article in the included resources
        const article = result.body.included.find(
          resource => resource.type === 'article'
        );

        expect(article).toBeDefined();

        // Verify only the requested fields are included
        expect(article.attributes).toHaveProperty('body');
        expect(article.attributes).toHaveProperty('voteCount');

        // Verify the attributes object doesn't have more than the specified fields
        expect(Object.keys(article.attributes).length).toBeLessThanOrEqual(2);
      });
    });
  });
});
