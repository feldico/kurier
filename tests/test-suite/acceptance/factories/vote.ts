import { getFactoryObject } from "./utils";

const votes = [
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
];

const getVote = getFactoryObject(votes, "id");
const results = {
  toGetIncludedUserAndArticle: {
    data: {
      ...getVote(1),
      links: {
        self: "/vote/1"
      },
      relationships: {
        ...getVote(1).relationships,
        article: {
          ...getVote(1).relationships.article,
          links: {
            self: "/vote/1/relationships/article",
            related: "/vote/1/article"
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
          }
        },
        user: {
          ...getVote(1).relationships.user,
          links: {
            self: "/vote/1/relationships/user",
            related: "/vote/1/user"
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
          }
        }
      }
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
            { name: "Joel" },
            { name: "Ryan" },
          ],
          roles: ["user", "author", "voter"],
        },
        links: { self: "/user/1" },
        relationships: {
          articles: {
            data: null,
            links: { related: "/user/1/articles", self: "/user/1/relationships/articles" }
          },
          comments: {
            data: null,
            links: { related: "/user/1/comments", self: "/user/1/relationships/comments" }
          },
          votes: {
            data: null,
            links: { related: "/user/1/votes", self: "/user/1/relationships/votes" }
          }
        },
      },
      {
        id: 1,
        type: "article",
        attributes: {
          body: "this is test 1",
          voteCount: 2,
        },
        links: { self: "/article/1" },
        relationships: {
          author: {
            data: { id: 1, type: "user" },
            links: { self: "/article/1/relationships/author", related: "/article/1/author" }
          },
          tags: {
            data: null,
            links: { self: "/article/1/relationships/tags", related: "/article/1/tags" },
            meta: { intermediateTable: "articles_tags", relationshipType: "manyToMany" }
          },
          votes: {
            data: null,
            links: { self: "/article/1/relationships/votes", related: "/article/1/votes" }
          },
        },
      },
    ],
  },
};

export { votes, results };
export default results;
