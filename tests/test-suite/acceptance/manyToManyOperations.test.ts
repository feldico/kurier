import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);

  describe("Many-to-Many Relationship Operations", () => {
    let articleId;

    // Create a fresh article for testing many-to-many operations
    beforeEach(async () => {
      // Create a new article without any tags initially
      const createResponse = await request.post('/articles').send({
        data: {
          type: "article",
          attributes: {
            body: "Test article for many-to-many operations"
          },
          relationships: {
            author: {
              data: {
                id: "1",
                type: "user"
              }
            },
            tags: {
              data: []
            }
          }
        }
      });

      expect(createResponse.status).toEqual(201);
      articleId = createResponse.body.data.id;

      // Verify the article was created and has no tags
      const getResponse = await request.get(`/articles/${articleId}?include=tags`);
      expect(getResponse.status).toEqual(200);
      expect(getResponse.body.data.relationships.tags.data).toEqual([]);
    });

    // Test adding a single tag to an article
    it("should add a single tag to an article", async () => {
      // Add tag 1 to the article
      const updateResponse = await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Test article for many-to-many operations" // Include existing attributes
          },
          relationships: {
            tags: {
              data: [
                {
                  id: "1",
                  type: "tag"
                }
              ]
            },
            author: {
              data: {
                id: "1",
                type: "user"
              }
            }
          }
        }
      });

      expect(updateResponse.status).toEqual(200);

      // Verify the tag was added
      const getResponse = await request.get(`/articles/${articleId}?include=tags`);
      expect(getResponse.status).toEqual(200);
      expect(getResponse.body.data.relationships.tags.data).toHaveLength(1);
      expect(getResponse.body.data.relationships.tags.data[0].id).toEqual(1);
      expect(getResponse.body.data.relationships.tags.data[0].type).toEqual("tag");

      // Verify the relationship has links
      expect(getResponse.body.data.relationships.tags).toHaveProperty('links');
      expect(getResponse.body.data.relationships.tags.links).toHaveProperty('self');
      expect(getResponse.body.data.relationships.tags.links).toHaveProperty('related');

      // Verify the relationship has metadata
      expect(getResponse.body.data.relationships.tags).toHaveProperty('meta');
      expect(getResponse.body.data.relationships.tags.meta).toHaveProperty('relationshipType', 'manyToMany');
      expect(getResponse.body.data.relationships.tags.meta).toHaveProperty('intermediateTable', 'articles_tags');

      // Verify we can access the tag's article relationship
      const tagResponse = await request.get('/tags/1?include=articles');
      expect(tagResponse.status).toEqual(200);
      expect(tagResponse.body.data.relationships.articles.data.some(article =>
        article.id === articleId
      )).toBeTruthy();
    });

    // Test adding multiple tags to an article
    it("should add multiple tags to an article", async () => {
      // Add tags 1 and 2 to the article
      const updateResponse = await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Test article for many-to-many operations" // Include existing attributes
          },
          relationships: {
            tags: {
              data: [
                {
                  id: "1",
                  type: "tag"
                },
                {
                  id: "2",
                  type: "tag"
                }
              ]
            },
            author: {
              data: {
                id: "1",
                type: "user"
              }
            }
          }
        }
      });

      expect(updateResponse.status).toEqual(200);

      // Verify both tags were added
      const getResponse = await request.get(`/articles/${articleId}?include=tags`);
      expect(getResponse.status).toEqual(200);
      expect(getResponse.body.data.relationships.tags.data).toHaveLength(2);

      // Sort the tags by ID to ensure consistent testing
      const sortedTags = [...getResponse.body.data.relationships.tags.data].sort((a, b) =>
        parseInt(a.id) - parseInt(b.id)
      );

      expect(sortedTags[0].id).toEqual(1);
      expect(sortedTags[0].type).toEqual("tag");
      expect(sortedTags[1].id).toEqual(2);
      expect(sortedTags[1].type).toEqual("tag");
    });

    // Test removing tags from an article
    it("should remove tags from an article", async () => {
      // First add tags 1 and 2
      await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Test article for many-to-many operations" // Include existing attributes
          },
          relationships: {
            tags: {
              data: [
                {
                  id: "1",
                  type: "tag"
                },
                {
                  id: "2",
                  type: "tag"
                }
              ]
            },
            author: {
              data: {
                id: "1",
                type: "user"
              }
            }
          }
        }
      });

      // Now update to only include tag 2
      const updateResponse = await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Test article for many-to-many operations" // Include existing attributes
          },
          relationships: {
            tags: {
              data: [
                {
                  id: "2",
                  type: "tag"
                }
              ]
            },
            author: {
              data: {
                id: "1",
                type: "user"
              }
            }
          }
        }
      });

      expect(updateResponse.status).toEqual(200);

      // Verify only tag 2 remains
      const getResponse = await request.get(`/articles/${articleId}?include=tags`);
      expect(getResponse.status).toEqual(200);
      expect(getResponse.body.data.relationships.tags.data).toHaveLength(1);
      expect(getResponse.body.data.relationships.tags.data[0].id).toEqual(2);
      expect(getResponse.body.data.relationships.tags.data[0].type).toEqual("tag");

      // Also verify tag 1 no longer includes this article
      const tag1Response = await request.get('/tags/1?include=articles');
      expect(tag1Response.status).toEqual(200);

      const tag1Articles = tag1Response.body.data.relationships.articles.data || [];
      const hasArticle = tag1Articles.some(article => article.id === articleId);
      expect(hasArticle).toBeFalsy();
    });

    // Test removing all tags from an article
    it("should remove all tags from an article", async () => {
      // First add tags 1 and 2
      await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Test article for many-to-many operations" // Include existing attributes
          },
          relationships: {
            tags: {
              data: [
                {
                  id: "1",
                  type: "tag"
                },
                {
                  id: "2",
                  type: "tag"
                }
              ]
            },
            author: {
              data: {
                id: "1",
                type: "user"
              }
            }
          }
        }
      });

      // Now update to have no tags
      const updateResponse = await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Test article for many-to-many operations" // Include existing attributes
          },
          relationships: {
            tags: {
              data: []
            },
            author: {
              data: {
                id: "1",
                type: "user"
              }
            }
          }
        }
      });

      expect(updateResponse.status).toEqual(200);

      // Verify no tags remain
      const getResponse = await request.get(`/articles/${articleId}?include=tags`);
      expect(getResponse.status).toEqual(200);
      expect(getResponse.body.data.relationships.tags.data).toHaveLength(0);
    });

    // Test replacing all tags in a single operation
    it("should replace all tags in a single operation", async () => {
      // First add tag 1
      await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Test article for many-to-many operations" // Include existing attributes
          },
          relationships: {
            tags: {
              data: [
                {
                  id: "1",
                  type: "tag"
                }
              ]
            },
            author: {
              data: {
                id: "1",
                type: "user"
              }
            }
          }
        }
      });

      // Now replace with tag 2
      const updateResponse = await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Test article for many-to-many operations" // Include existing attributes
          },
          relationships: {
            tags: {
              data: [
                {
                  id: "2",
                  type: "tag"
                }
              ]
            },
            author: {
              data: {
                id: "1",
                type: "user"
              }
            }
          }
        }
      });

      expect(updateResponse.status).toEqual(200);

      // Verify only tag 2 is present
      const getResponse = await request.get(`/articles/${articleId}?include=tags`);
      expect(getResponse.status).toEqual(200);
      expect(getResponse.body.data.relationships.tags.data).toHaveLength(1);
      expect(getResponse.body.data.relationships.tags.data[0].id).toEqual(2);
      expect(getResponse.body.data.relationships.tags.data[0].type).toEqual("tag");
    });

    // Test that relationships are preserved when not included in the request
    it("should preserve relationships when they are not included in the request", async () => {
      // First add tags 1 and 2
      await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Test article for many-to-many operations"
          },
          relationships: {
            tags: {
              data: [
                {
                  id: "1",
                  type: "tag"
                },
                {
                  id: "2",
                  type: "tag"
                }
              ]
            },
            author: {
              data: {
                id: "1",
                type: "user"
              }
            }
          }
        }
      });

      // Verify tags were added
      let getResponse = await request.get(`/articles/${articleId}?include=tags`);
      expect(getResponse.status).toEqual(200);
      expect(getResponse.body.data.relationships.tags.data).toHaveLength(2);

      // Now update the article without including the tags relationship
      const updateResponse = await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Updated article body - relationships should be preserved"
          },
          // Intentionally omit all relationships
        }
      });

      expect(updateResponse.status).toEqual(200);

      // Verify the article was updated
      expect(updateResponse.body.data.attributes.body).toEqual("Updated article body - relationships should be preserved");

      // Verify the tags are still present
      getResponse = await request.get(`/articles/${articleId}?include=tags`);
      expect(getResponse.status).toEqual(200);
      expect(getResponse.body.data.relationships.tags.data).toHaveLength(2);

      // Sort the tags and verify they're the same
      const sortedTags = [...getResponse.body.data.relationships.tags.data].sort((a, b) =>
        parseInt(a.id) - parseInt(b.id)
      );

      expect(sortedTags[0].id).toEqual(1);
      expect(sortedTags[0].type).toEqual("tag");
      expect(sortedTags[1].id).toEqual(2);
      expect(sortedTags[1].type).toEqual("tag");

      // Verify the author relationship is also preserved
      expect(getResponse.body.data.relationships.author.data.id).toEqual(1);
      expect(getResponse.body.data.relationships.author.data.type).toEqual("user");
    });

    // Test that you can update other relationships without affecting many-to-many relationships
    it("should allow updating other relationships without affecting many-to-many relationships", async () => {
      // First add tags 1 and 2
      await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Test article for many-to-many operations"
          },
          relationships: {
            tags: {
              data: [
                {
                  id: "1",
                  type: "tag"
                },
                {
                  id: "2",
                  type: "tag"
                }
              ]
            },
            author: {
              data: {
                id: "1",
                type: "user"
              }
            }
          }
        }
      });

      // Now update the article's author without including the tags relationship
      const updateResponse = await request.patch(`/articles/${articleId}`).send({
        data: {
          id: articleId,
          type: "article",
          attributes: {
            body: "Updated article with new author"
          },
          relationships: {
            author: {
              data: {
                id: "2",
                type: "user"
              }
            }
            // Tags relationship not included
          }
        }
      });

      expect(updateResponse.status).toEqual(200);

      // Verify the article was updated with new author
      const getResponse = await request.get(`/articles/${articleId}?include=tags`);
      expect(getResponse.status).toEqual(200);
      expect(getResponse.body.data.attributes.body).toEqual("Updated article with new author");
      expect(getResponse.body.data.relationships.author.data.id).toEqual(2);

      // Verify the tags are still present
      expect(getResponse.body.data.relationships.tags.data).toHaveLength(2);

      // Sort the tags and verify they're the same
      const sortedTags = [...getResponse.body.data.relationships.tags.data].sort((a, b) =>
        parseInt(a.id) - parseInt(b.id)
      );

      expect(sortedTags[0].id).toEqual(1);
      expect(sortedTags[0].type).toEqual("tag");
      expect(sortedTags[1].id).toEqual(2);
      expect(sortedTags[1].type).toEqual("tag");
    });
  });
});
