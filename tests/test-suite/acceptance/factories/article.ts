export const articles = [
  {
    id: 1,
    type: "article",
    attributes: {
      body: "this is test 1",
      voteCount: 2,
    },
    relationships: {
      author: {
        data: {
          id: 1,
          type: "user",
        },
      },
    },
  },
  {
    id: 2,
    type: "article",
    attributes: {
      body: "this is test 2",
      voteCount: 0,
    },
    relationships: {
      author: {
        data: {
          id: 2,
          type: "user",
        },
      },
    },
  },
  {
    id: 3,
    type: "article",
    attributes: {
      body: "this is test 3",
      voteCount: 1,
    },
    relationships: {
      author: {
        data: {
          id: 2,
          type: "user",
        },
      },
    },
  },
];

export default {
  toGet: {
    response: [
      {
        id: 1,
        attributes: {
          body: "this is test 1",
          voteCount: 2,
        },
        type: "article",
        relationships: {
          author: {
            data: { id: 1, type: "user" },
            links: {
              self: "/article/1/relationships/author",
              related: "/article/1/author"
            }
          },
          tags: {
            data: null,
            links: {
                self: "/article/1/relationships/tags",
                related: "/article/1/tags"
            },
            meta: {
                intermediateTable: "articles_tags",
                relationshipType: "manyToMany"
            }
          },
          votes: {
            data: null,
            links: {
                self: "/article/1/relationships/votes",
                related: "/article/1/votes"
            }
          },
        },
        links: {
          self: "/article/1"
        },
        meta: {
          hello: "world",
        },
      },
      {
        id: 2,
        attributes: {
          body: "this is test 2",
          voteCount: 0,
        },
        type: "article",
        relationships: {
          author: {
            data: { id: 2, type: "user" },
            links: {
              self: "/article/2/relationships/author",
              related: "/article/2/author"
            }
          },
          tags: {
            data: null,
            links: {
                self: "/article/2/relationships/tags",
                related: "/article/2/tags"
            },
            meta: {
                intermediateTable: "articles_tags",
                relationshipType: "manyToMany"
            }
          },
          votes: {
            data: null,
            links: {
                self: "/article/2/relationships/votes",
                related: "/article/2/votes"
            }
          },
        },
        links: {
          self: "/article/2"
        },
        meta: {
          hello: "world",
        },
      },
      {
        id: 3,
        attributes: {
          body: "this is test 3",
          voteCount: 1,
        },
        type: "article",
        relationships: {
          author: {
            data: { id: 2, type: "user" },
            links: {
              self: "/article/3/relationships/author",
              related: "/article/3/author"
            }
          },
          tags: {
            data: null,
            links: {
                self: "/article/3/relationships/tags",
                related: "/article/3/tags"
            },
            meta: {
                intermediateTable: "articles_tags",
                relationshipType: "manyToMany"
            }
          },
          votes: {
            data: null,
            links: {
                self: "/article/3/relationships/votes",
                related: "/article/3/votes"
            }
          },
        },
        links: {
          self: "/article/3"
        },
        meta: {
          hello: "world",
        },
      },
    ],
  },
  singleArticleMultipleIncludes: {
    data: {
      id: 1,
      type: "article",
      attributes: {
        body: "this is test 1",
        voteCount: 2,
      },
      links: {
        self: "/article/1"
      },
      meta: {
        hello: "world",
      },
      relationships: {
        author: {
          data: {
            id: 1,
            type: "user",
          },
          links: {
            self: "/article/1/relationships/author",
            related: "/article/1/author"
          }
        },
        votes: {
          data: [
            {
              id: 1,
              type: "vote",
            },
            {
              id: 2,
              type: "vote",
            },
          ],
          links: {
            self: "/article/1/relationships/votes",
            related: "/article/1/votes"
          }
        },
      },
    },
    included: [
      {
        id: 1,
        type: "user",
        attributes: {
          username: "me",
          email: "me@me.com",
          location: {
            lat: -10.24,
            lng: -10.25,
          },
          coolFactor: 3,
          friends: [
            {
              name: "Joel",
            },
            {
              name: "Ryan",
            },
          ],
          roles: ["user", "author", "voter"],
        },
        links: {
          self: "/user/1"
        },
        relationships: {
          articles: {
            data: null,
            links: {
              related: "/user/1/articles",
              self: "/user/1/relationships/articles",
            }
          },
          comments: {
              data: null,
              links: {
                related: "/user/1/comments",
                self: "/user/1/relationships/comments",
              }
          },
          votes: {
              data: null,
              links: {
                related: "/user/1/votes",
                self: "/user/1/relationships/votes",
              }
          }
        },
      },
      {
        id: 1,
        type: "vote",
        attributes: {
          points: 10,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        links: {
          self: "/vote/1"
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user",
            },
            links: {
              self: "/vote/1/relationships/user",
              related: "/vote/1/user"
            }
          },
          article: {
            data: {
              id: 1,
              type: "article",
            },
            links: {
              self: "/vote/1/relationships/article",
              related: "/vote/1/article"
            }
          },
        },
      },
      {
        id: 2,
        type: "vote",
        attributes: {
          points: 2,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        links: {
          self: "/vote/2"
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user",
            },
            links: {
              self: "/vote/2/relationships/user",
              related: "/vote/2/user"
            }
          },
          article: {
            data: {
              id: 1,
              type: "article",
            },
            links: {
              self: "/vote/2/relationships/article",
              related: "/vote/2/article"
            }
          },
        },
      },
    ],
  },
  fistArticleWithTagsIncluded: {
    data: {
      id: 1,
      type: "article",
      attributes: {
        body: "this is test 1",
        voteCount: 2,
      },
      links: {
        self: "/article/1"
      },
      meta: {
        hello: "world",
      },
      relationships: {
        author: {
          data: {
            id: 1,
            type: "user",
          },
          links: {
            self: "/article/1/relationships/author",
            related: "/article/1/author"
          }
        },
        tags: {
          data: [
            {
              id: 1,
              type: "tag",
            },
          ],
          links: {
            self: "/article/1/relationships/tags",
            related: "/article/1/tags"
          },
          meta: {
            intermediateTable: "articles_tags",
            relationshipType: "manyToMany"
          }
        },
      },
    },
    included: [
      {
        id: 1,
        type: "tag",
        attributes: {
          name: "News",
        },
        links: {
          self: "/tag/1"
        },
        relationships: {
          articles: {
              data: null,
              links: {
                related: "/tag/1/articles",
                self: "/tag/1/relationships/articles",
              },
              meta: {
                intermediateTable: "articles_tags",
                relationshipType: "manyToMany",
              },
          }
        },
      },
    ],
  },
  multipleArticlesIncludedTags: {
    data: [
      {
        id: 1,
        type: "article",
        attributes: {
          body: "this is test 1",
          voteCount: 2,
        },
        relationships: {
          votes: {
            data: [
              {
                id: 1,
                type: "vote",
              },
              {
                id: 2,
                type: "vote",
              },
            ],
          },
          author: {
            data: {
              id: 1,
              type: "user",
            },
          },
        },
        meta: {
          hello: "world",
        },
      },

    ],
    included: [
      {
        id: 1,
        type: "vote",
        attributes: {
          points: 10,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user",
            },
          },
          article: {
            data: {
              id: 1,
              type: "article",
            },
          },
        },
      },
      {
        id: 2,
        type: "vote",
        attributes: {
          points: 2,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user",
            },
          },
          article: {
            data: {
              id: 1,
              type: "article",
            },
          },
        },
      },
      {
        id: 3,
        type: "vote",
        attributes: {
          points: 8,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        relationships: {
          user: {
            data: {
              id: 3,
              type: "user",
            },
          },
          article: {
            data: {
              id: 3,
              type: "article",
            },
          },
        },
      },
    ],
  },
  multipleArticlesIncludedVotes: {
    data: [
      {
        id: 1,
        type: "article",
        attributes: {
          body: "this is test 1",
          voteCount: 2,
        },
        links: {
          self: "/article/1"
        },
        relationships: {
          votes: {
            data: [
              {
                id: 1,
                type: "vote",
              },
              {
                id: 2,
                type: "vote",
              },
            ],
            links: {
              self: "/article/1/relationships/votes",
              related: "/article/1/votes"
            }
          },
          author: {
            data: {
              id: 1,
              type: "user",
            },
            links: {
              self: "/article/1/relationships/author",
              related: "/article/1/author"
            }
          },
        },
        meta: {
          hello: "world",
        },
      },
      {
        id: 2,
        type: "article",
        attributes: {
          body: "this is test 2",
          voteCount: 0,
        },
        links: {
          self: "/article/2"
        },
        meta: {
          hello: "world",
        },
        relationships: {
          votes: {
            data: [],
            links: {
              self: "/article/2/relationships/votes",
              related: "/article/2/votes"
            }
          },
          author: {
            data: {
              id: 2,
              type: "user",
            },
            links: {
              self: "/article/2/relationships/author",
              related: "/article/2/author"
            }
          },
        },
      },
      {
        id: 3,
        type: "article",
        attributes: {
          body: "this is test 3",
          voteCount: 1,
        },
        links: {
          self: "/article/3"
        },
        meta: {
          hello: "world",
        },
        relationships: {
          votes: {
            data: [
              {
                id: 3,
                type: "vote",
              },
            ],
            links: {
              self: "/article/3/relationships/votes",
              related: "/article/3/votes"
            }
          },
          author: {
            data: {
              id: 2,
              type: "user",
            },
            links: {
              self: "/article/3/relationships/author",
              related: "/article/3/author"
            }
          },
        },
      },
    ],
    included: [
      {
        id: 1,
        type: "vote",
        attributes: {
          points: 10,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        links: {
          self: "/vote/1"
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user",
            },
            links: {
              self: "/vote/1/relationships/user",
              related: "/vote/1/user"
            }
          },
          article: {
            data: {
              id: 1,
              type: "article",
            },
            links: {
              self: "/vote/1/relationships/article",
              related: "/vote/1/article"
            }
          },
        },
      },
      {
        id: 2,
        type: "vote",
        attributes: {
          points: 2,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        links: {
          self: "/vote/2"
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user",
            },
            links: {
              self: "/vote/2/relationships/user",
              related: "/vote/2/user"
            }
          },
          article: {
            data: {
              id: 1,
              type: "article",
            },
            links: {
              self: "/vote/2/relationships/article",
              related: "/vote/2/article"
            }
          },
        },
      },
      {
        id: 3,
        type: "vote",
        attributes: {
          points: 8,
          createdOn: null,
          updatedOn: null,
          updatedBy: null,
          createdBy: null,
        },
        links: {
          self: "/vote/3"
        },
        relationships: {
          user: {
            data: {
              id: 3,
              type: "user",
            },
            links: {
              self: "/vote/3/relationships/user",
              related: "/vote/3/user"
            }
          },
          article: {
            data: {
              id: 3,
              type: "article",
            },
            links: {
              self: "/vote/3/relationships/article",
              related: "/vote/3/article"
            }
          },
        },
      },
    ],
  },
  forCreation: {
    requests: {
      jsonapi:
        {data: {
          type: "article",
          attributes: {
            body: "test",
          },
          relationships: {
            tags: {
              data: [{
                id: 1,
                type: "tag",
              },{
                id: 2,
                type: "tag",
              },
              ]
            },
          },
        },
      },
    }
  },
  forUpdate: {
    requests: {
      jsonapi:
      {
        data: {
          type: "article",
          id: 1,
          attributes: {
            body: "coso",
          },
          relationships: {
            tags: {
              data: [
                {
                  id: 1,
                  type: "tag",
                },
                {
                  id: 2,
                  type: "tag",
                },
              ],
            },
          },
        },
      }
    }
  }
}
