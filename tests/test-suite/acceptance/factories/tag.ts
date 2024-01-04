import { articles } from "./article"

export const tags = [ {
    id: 1,
    type: "tag",
    attributes: {
      name: "News",
    },
    relationships: {
      articles: {
        data: [
          {
            id: 1,
            type: "article",
          },
        ],
      },
    },
  },
]

export default {
  fistTagsWithArticlesIncluded: {
    data: {
      id: 1,
      type: "tag",
      attributes: {
        name: "News",
      },
      relationships: {
        articles: {
          data:
            [{
              id: 1,
              type: "article",
            },]
        },
      },
    },
    included: [
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
    ]
}}