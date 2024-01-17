import articles from "./factories/article";
import tags from "./factories/tag";
import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);
  describe("manyToMany", () => {
    describe("GET", () => {
      it("Gets 1st article with tags", async () => {
        const result = await request.get(`/articles/1?include=tags`);
        expect(result.status).toEqual(200);
        expect(result.body).toEqual(articles.fistArticleWithTagsIncluded);
      });
      it("Gets 1st Tags with articles", async () => {
        const result = await request.get(`/tags/1?include=articles`);
        expect(result.status).toEqual(200);
        expect(result.body).toEqual(tags.fistTagsWithArticlesIncluded);
      });
      describe("POST", () => {
        it("Create article with tags", async () => {
          const result = await request.post(`/articles`).send(articles.forCreation.requests.jsonapi);
          expect(result.status).toEqual(201);
          const newResourceWithTags = await request.get(`/articles/4?include=tags`);
          expect(newResourceWithTags.status).toEqual(200);
          expect(newResourceWithTags.body.data.relationships.tags.data).toEqual(
            articles.forCreation.requests.jsonapi.data.relationships.tags.data,
          );
        });
      });
      describe("DELETE", () => {
        it("Delete 1st tag and his relationships", async () => {
          const deleteResponse = await request.delete("/tag/1");
          expect(deleteResponse.status).toEqual(204);
          const fistArticleWithTags = await request.get("/articles/1?include=tags");
          expect(fistArticleWithTags.body.data.relationships.tags.data).toEqual([]);
        });
      });
      describe("PATCH", () => {
        it("Update a article - change tags", async () => {
          const result = await request.patch(`/articles/1`).send(articles.forUpdate.requests.jsonapi);
          expect(result.status).toEqual(200);
          const fistArticleWithTags = await request.get(`/articles/1?include=tags`);
          expect(fistArticleWithTags.status).toEqual(200);
          expect(fistArticleWithTags.body.data.relationships.tags.data).toEqual(articles.forUpdate.requests.jsonapi.data.relationships.tags.data);
        });
      });
    });
  });
});
