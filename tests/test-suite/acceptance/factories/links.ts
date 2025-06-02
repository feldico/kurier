import article from "./article";
import { getFactoryObjects } from "./utils";
import { votes } from "./vote";

export default {
  singleArticle: {
    data: {
      ...article.toGet.response[0],
      links: {
        self: "/article/1"
      },
      relationships: {
        author: {
          data: {
            id: "1",
            type: "user"
          },
          links: {
            self: "/article/1/relationships/author",
            related: "/article/1/author"
          }
        },
        votes: {
          data: getFactoryObjects(votes)([1, 2]),
          links: {
            self: "/article/1/relationships/votes",
            related: "/article/1/votes"
          }
        },
        tags: {
          data: [],
          links: {
            self: "/article/1/relationships/tags",
            related: "/article/1/tags"
          },
          meta: {
            intermediateTable: "articles_tags",
            relationshipType: "manyToMany"
          }
        }
      }
    }
  },

  articleCollection: {
    data: article.toGet.response.map(articleData => ({
      ...articleData,
      links: {
        self: `/article/${articleData.id}`
      }
    })),
    links: {
      self: "/article"
    }
  },

  articleVotes: {
    data: getFactoryObjects(votes)([1, 2]),
    links: {
      self: "/article/1/votes"
    }
  },

  articleVotesRelationship: {
    data: getFactoryObjects(votes)([1, 2]).map(vote => ({
      id: vote.id,
      type: vote.type
    })),
    links: {
      self: "/article/1/relationships/votes",
      related: "/article/1/votes"
    }
  }
};
