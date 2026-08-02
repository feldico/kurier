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
      links: {
        self: "/tag/1",
      },
      relationships: {
        articles: {
          data: [{
            id: 1,
            type: "article",
          }],
          links: {
            related: "/tag/1/articles",
            self: "/tag/1/relationships/articles",
          },
          meta: {
            intermediateTable: "articles_tags",
            relationshipType: "manyToMany",
          },
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
        links: { self: "/article/1" },
        meta: { hello: "world" },
        relationships: {
           author: {
            data: { id: 1, type: "user" },
            links: { self: "/article/1/relationships/author", related: "/article/1/author" }
          },
          tags: {
            data: [ {id: 1, type: "tag"} ],
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
        type: "tag",
        attributes: { name: "News" },
        links: { self: "/tag/1" },
        relationships: {
          articles: {
            data: null,
            links: { related: "/tag/1/articles", self: "/tag/1/relationships/articles" },
            meta: { intermediateTable: "articles_tags", relationshipType: "manyToMany" }
          }
        }
      }
    ]
  }
}
