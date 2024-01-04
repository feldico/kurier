import  articles  from "./factories/article";
import  tags  from "./factories/tag";
import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);
  describe("Votes", () => {
    describe("GET", () => {
      it("Gets 1st article with tags", async () => {
        const result = await request.get(`/articles/1?include=tags`);
        expect(result.status).toEqual(200);
        expect(result.body).toEqual(articles.fistArticleWithTagsIncluded);
      });
      it("Gets tags with articles", async () => {
        const result = await request.get(`/tags/1?include=articles`);
        expect(result.status).toEqual(200);
        expect(result.body).toEqual(tags.fistTagsWithArticlesIncluded);
      });
    });
  });
});
