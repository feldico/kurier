import { getFactoryObjects, getFactoryObject, getExtraRelationships } from "./utils";
import { votes } from "./vote";
import { articles } from "./article";
import { users } from "./user";
import { comments } from "./comment";

export default {
  get: {
    authorAndAuthorVotesOf1stArticle: {
      data: {
        type: "article",
        id: 1,
        attributes: {
          body: "this is test 1",
          voteCount: 2,
        },
        meta: {
          hello: "world",
        },
        links: { self: "/article/1" },
        relationships: {
          author: {
            data: { type: "user", id: 1 },
            links: { related: "/article/1/author", self: "/article/1/relationships/author" },
          },
        },
      },
      included: [
        {
          type: "user",
          id: 1,
          attributes: {
            email: "me@me.com",
            username: "me",
            coolFactor: 11,
            roles: ["user", "author", "voter"],
            location: {
              lat: -10.23,
              lng: -10.24,
            },
            friends: [
              { name: "Joel" },
              { name: "Ryan" },
              {
                name: "Marc",
                attributes: {
                  age: 28,
                },
              },
            ],
          },
          links: { self: "/user/1" },
          relationships: {},
        },
        {
          type: "vote",
          id: 1,
          attributes: {
            createdOn: null,
            createdBy: null,
            updatedOn: null,
            updatedBy: null,
            points: 10,
          },
          links: { self: "/vote/1" },
          relationships: {
            user: {
              data: { type: "user", id: 1 },
              links: { related: "/vote/1/user", self: "/vote/1/relationships/user" },
            },
            article: {
              data: { type: "article", id: 1 },
              links: { related: "/vote/1/article", self: "/vote/1/relationships/article" },
            },
          },
        },
        {
          type: "vote",
          id: 2,
          attributes: {
            createdOn: null,
            createdBy: null,
            updatedOn: null,
            updatedBy: null,
            points: 2,
          },
          links: { self: "/vote/2" },
          relationships: {
            user: {
              data: { type: "user", id: 1 },
              links: { related: "/vote/2/user", self: "/vote/2/relationships/user" },
            },
            article: {
              data: { type: "article", id: 1 },
              links: { related: "/vote/2/article", self: "/vote/2/relationships/article" },
            },
          },
        },
      ],
    },
    articlesAndArticlesVotsOf2ndUser: {
      data: {
        ...getFactoryObject(users)(2),
        relationships: {
          ...getExtraRelationships(articles, "articles")([2, 3]),
        },
      },
      included: [...getFactoryObjects(articles)([2, 3]), getFactoryObject(votes)(3)],
    },
    parentCommentAndParentCommentsAuthorOf1stComment: {
      data: getFactoryObject(comments)(1),
      included: [getFactoryObject(comments)(2), getFactoryObject(users)(2)],
    },
    parentCommentAndParentCommentsParentCommentOf1stComment: {
      data: getFactoryObject(comments)(1),
      included: [getFactoryObject(comments)(2), getFactoryObject(comments)(3)],
    },
    authorAndAuthorVotesAndAuthorCommentsOf1stArticle: {
      data: {
        type: "article",
        id: 1,
        attributes: {
          body: "this is test 1",
          voteCount: 2,
        },
        meta: {
          hello: "world",
        },
        links: { self: "/article/1" },
        relationships: {
          author: {
            data: { type: "user", id: 1 },
            links: { related: "/article/1/author", self: "/article/1/relationships/author" },
          },
        },
      },
      included: [
        {
          type: "user",
          id: 1,
          attributes: {
            email: "me@me.com",
            username: "me",
            coolFactor: 11,
            roles: ["user", "author", "voter"],
            location: {
              lat: -10.23,
              lng: -10.24,
            },
            friends: [
              { name: "Joel" },
              { name: "Ryan" },
              {
                name: "Marc",
                attributes: {
                  age: 28,
                },
              },
            ],
          },
          links: { self: "/user/1" },
          relationships: {},
        },
      ],
    },
  },
};
