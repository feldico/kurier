import { getFactoryObjects, getFactoryObject } from "./utils";
import { votes } from "./vote";
import article from "./article";

export default {
  get: {
    votesOf1stArticle: {
      data: [...getFactoryObjects(votes)([1, 2])].map(vote => ({
        ...vote,
        links: {
          self: `/vote/${vote.id}`
        },
        relationships: {
          ...vote.relationships,
          article: {
            ...vote.relationships.article,
            links: {
              self: `/vote/${vote.id}/relationships/article`,
              related: `/vote/${vote.id}/article`
            }
          },
          user: {
            ...vote.relationships.user,
            links: {
              self: `/vote/${vote.id}/relationships/user`,
              related: `/vote/${vote.id}/user`
            }
          }
        }
      })),
    },
    votesOf2ndArticle: {
      data: [],
    },
    votesOf3rdArticle: {
      data: [{
        ...getFactoryObject(votes)(3),
        links: {
          self: `/vote/3`
        },
        relationships: {
          ...getFactoryObject(votes)(3).relationships,
          article: {
            ...getFactoryObject(votes)(3).relationships.article,
            links: {
              self: `/vote/3/relationships/article`,
              related: `/vote/3/article`
            }
          },
          user: {
            ...getFactoryObject(votes)(3).relationships.user,
            links: {
              self: `/vote/3/relationships/user`,
              related: `/vote/3/user`
            }
          }
        }
      }],
    },
    articleOf1stVote: {
      data: {
        ...article.toGet.response[0],
        links: {
          self: `/article/1`
        },
        relationships: {
          ...article.toGet.response[0].relationships,
          author: {
            ...article.toGet.response[0].relationships.author,
            links: {
              self: `/article/1/relationships/author`,
              related: `/article/1/author`
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
    },
    parentCommentOf1stComment: {
      data: {
        id: 2,
        type: "comment",
        attributes: {
          body: "hello2",
          type: "not_spam",
        },
        links: {
          self: `/comment/2`
        },
        relationships: {
          author: {
            data: {
              id: 2,
              type: "user",
            },
            links: {
              self: `/comment/2/relationships/author`,
              related: `/comment/2/author`
            }
          },
          parentComment: {
            data: {
              id: 3,
              type: "comment",
            },
            links: {
              self: `/comment/2/relationships/parentComment`,
              related: `/comment/2/parentComment`
            }
          },
        },
      },
    },
  },
};
