export const users = [
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
      friends: [
        {
          name: "Joel",
        },
        {
          name: "Ryan",
        },
      ],
      coolFactor: 3,
      roles: ["user", "author", "voter"],
    },
    relationships: {},
  },
  {
    id: 2,
    type: "user",
    attributes: {
      username: "username2",
      email: "me2@me.com",
      location: {
        lat: -10.26,
        lng: -10.27,
      },
      friends: [
        {
          name: "Joel",
        },
        {
          name: "Ryan",
        },
      ],
      coolFactor: 3,
      roles: ["user", "author", "voter"],
    },
    relationships: {},
  },
  {
    id: 3,
    type: "user",
    attributes: {
      username: "username3",
      email: "me3@me.com",
      location: {
        lat: -10.28,
        lng: -10.29,
      },
      friends: [
        {
          name: "Joel",
        },
        {
          name: "Ryan",
        },
      ],
      coolFactor: 3,
      roles: ["user", "author", "voter"],
    },
    relationships: {},
  },
];

export default {
  forCreation: {
    request: {
      data: {
        attributes: {
          email: "creationtest@test.com",
          password: "test",
          username: "creationtest",
          location: {
            lat: -20.24,
            lng: -20.25,
          },
        },
        type: "user",
        relationships: {},
      },
    },
    response: {
      data: {
        id: 4,
        type: "user",
        attributes: {
          username: "creationtest",
          email: "creationtest@test.com",
          location: {
            lat: -20.24,
            lng: -20.25,
          },
          friends: [{ name: "Joel" }, { name: "Ryan" }],
          coolFactor: 3,
          roles: ["user", "author", "voter"],
        },
        links: { self: "/user/4" },
        relationships: {
          articles: {
            data: null,
            links: {
              related: "/user/4/articles",
              self: "/user/4/relationships/articles",
            }
          },
          comments: {
            data: null,
            links: {
              related: "/user/4/comments",
              self: "/user/4/relationships/comments",
            }
          },
          votes: {
            data: null,
            links: {
              related: "/user/4/votes",
              self: "/user/4/relationships/votes",
            }
          }
        },
      },
    },
  },
  toUpdate: {
    dataToUpdate: {
      data: {
        type: "user",
        attributes: {
          email: "updatetest@test.com",
        },
      },
    },
    response: {
      data: {
        id: 2,
        type: "user",
        attributes: {
          username: "username2",
          email: "updatetest@test.com",
          location: {
            lat: -10.26,
            lng: -10.27,
          },
          friends: [{ name: "Joel" }, { name: "Ryan" }],
          coolFactor: 3,
          roles: ["user", "author", "voter"],
        },
        links: { self: "/user/2" },
        relationships: {
          articles: {
            data: null,
            links: {
              related: "/user/2/articles",
              self: "/user/2/relationships/articles",
            }
          },
          comments: {
            data: null,
            links: {
              related: "/user/2/comments",
              self: "/user/2/relationships/comments",
            }
          },
          votes: {
            data: null,
            links: {
              related: "/user/2/votes",
              self: "/user/2/relationships/votes",
            }
          }
        },
      },
    },
  },
  toAuthenticate: {
    request: {
      data: {
        attributes: {
          email: "me@me.com",
          password: "test",
        },
        type: "session",
        relationships: {},
      },
    },
    response: {
      data: {
        id: "STRING",
        type: "session",
        attributes: {
          token: "STRING",
        },
        relationships: {
          user: {
            data: {
              id: 1,
              type: "user",
            },
            links: {
              self: "/session/STRING/relationships/user",
              related: "/session/STRING/user"
            }
          },
        },
      },
    },
  },
  toGet: [
    // the first element here is the authenticated user
    {
      id: 1,
      type: "user",
      attributes: {
        email: "me@me.com",
        username: "me",
        location: {
          lat: -10.24,
          lng: -10.25,
        },
        friends: [{ name: "Joel" }, { name: "Ryan" }],
        coolFactor: 3,
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
      id: 2,
      type: "user",
      attributes: {
        email: "me2@me.com",
        username: "username2",
        location: {
          lat: -10.26,
          lng: -10.27,
        },
        friends: [{ name: "Joel" }, { name: "Ryan" }],
        coolFactor: 3,
        roles: ["user", "author", "voter"],
      },
      links: { self: "/user/2" },
      relationships: {
        articles: {
            data: null,
            links: {
              related: "/user/2/articles",
              self: "/user/2/relationships/articles",
            }
        },
        comments: {
            data: null,
            links: {
              related: "/user/2/comments",
              self: "/user/2/relationships/comments",
            }
        },
        votes: {
            data: null,
            links: {
              related: "/user/2/votes",
              self: "/user/2/relationships/votes",
            }
        }
      },
    },
    {
      id: 3,
      type: "user",
      attributes: {
        email: "me3@me.com",
        username: "username3",
        location: {
          lat: -10.28,
          lng: -10.29,
        },
        friends: [{ name: "Joel" }, { name: "Ryan" }],
        coolFactor: 3,
        roles: ["user", "author", "voter"],
      },
      relationships: {
        articles: {
            data: null,
            links: {
              related: "/user/3/articles",
              self: "/user/3/relationships/articles",
            }
        },
        comments: {
            data: null,
            links: {
              related: "/user/3/comments",
              self: "/user/3/relationships/comments",
            }
        },
        votes: {
            data: null,
            links: {
              related: "/user/3/votes",
              self: "/user/3/relationships/votes",
            }
        }
      },
    },
  ],
  multipleIncludeGetSingleUser: {
    data: {
      id: 1,
      type: "user",
      attributes: {
        username: "me",
        email: "me@me.com",
        location: {
          lat: -10.24,
          lng: -10.25,
        },
        friends: [
          {
            name: "Joel",
          },
          {
            name: "Ryan",
          },
        ],
        coolFactor: 3,
        roles: ["user", "author", "voter"],
      },
      relationships: {
        comments: {
          data: [
            {
              id: 1,
              type: "comment",
            },
            {
              id: 3,
              type: "comment",
            },
          ],
        },
        articles: {
          data: [
            {
              id: 1,
              type: "article",
            },
          ],
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
        },
      },
    },
    included: [
      {
        id: 1,
        type: "comment",
        attributes: {
          body: "hello",
          type: "not_spam",
        },
        links: { self: "/comment/1" },
        relationships: {
          author: {
            data: { id: 1, type: "user" },
            links: { self: "/comment/1/relationships/author", related: "/comment/1/author" }
          },
          parentComment: {
            data: { id: 2, type: "comment" },
            links: { self: "/comment/1/relationships/parentComment", related: "/comment/1/parentComment" }
          },
          article: {
            data: { id: 1, type: "article" },
            links: { self: "/comment/1/relationships/article", related: "/comment/1/article" }
          }
        },
      },
      {
        id: 3,
        type: "comment",
        attributes: {
          body: "hello3",
          type: "spam",
        },
        links: { self: "/comment/3" },
        relationships: {
          author: {
            data: { id: 1, type: "user" },
            links: { self: "/comment/3/relationships/author", related: "/comment/3/author" }
          },
          parentComment: {
            data: null,
            links: { self: "/comment/3/relationships/parentComment", related: "/comment/3/parentComment" }
          },
          article: {
            data: { id: 3, type: "article" },
            links: { self: "/comment/3/relationships/article", related: "/comment/3/article" }
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
        links: { self: "/vote/1" },
        relationships: {
          user: {
            data: { id: 1, type: "user" },
            links: { self: "/vote/1/relationships/user", related: "/vote/1/user" }
          },
          article: {
            data: { id: 1, type: "article" },
            links: { self: "/vote/1/relationships/article", related: "/vote/1/article" }
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
        links: { self: "/vote/2" },
        relationships: {
          user: {
            data: { id: 1, type: "user" },
            links: { self: "/vote/2/relationships/user", related: "/vote/2/user" }
          },
          article: {
            data: { id: 1, type: "article" },
            links: { self: "/vote/2/relationships/article", related: "/vote/2/article" }
          },
        },
      },
    ],
  },
  deletedUserError: {
    errors: [
      {
        code: "not_found",
        status: 404,
      },
    ],
  },
};
