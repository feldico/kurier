export const comments = [
  {
    id: 1,
    type: "comment",
    attributes: {
      body: "hello",
      type: "not_spam",
    },
    relationships: {
      author: {
        data: {
          id: 1,
          type: "user",
        },
      },
      parentComment: {
        data: {
          id: 2,
          type: "comment",
        },
      },
      article: {
        data: null,
        links: { self: "/comment/1/relationships/article", related: "/comment/1/article" }
      }
    },
  },
  {
    id: 2,
    type: "comment",
    attributes: {
      body: "hello2",
      type: "not_spam",
    },
    relationships: {
      author: {
        data: {
          id: 2,
          type: "user",
        },
      },
      parentComment: {
        data: {
          id: 3,
          type: "comment",
        },
      },
      article: {
        data: null,
        links: { self: "/comment/2/relationships/article", related: "/comment/2/article" }
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
    relationships: {
      author: {
        data: {
          id: 1,
          type: "user",
        },
      },
      parentComment: {
        data: null,
      },
      article: {
        data: null,
        links: { self: "/comment/3/relationships/article", related: "/comment/3/article" }
      }
    },
  },
];

export default {
  forCreation: {
    requests: {
      jsonapi: {
        data: {
          type: "comment",
          attributes: {
            body: "new commentttt",
            type: "spam",
          },
          relationships: {
            parentComment: {
              data: {
                id: 1,
                type: "comment",
              },
            },
            author: {
              data: {
                id: 2,
                type: "user",
              },
            },
            article: {
              data: null,
              links: { self: "/comment/4/relationships/article", related: "/comment/4/article" }
            }
          },
        },
      },
      rawRequestSnakeCase: {
        data: {
          attributes: {
            body: "new commentttt",
            type: "spam",
            author_id: 2,
            parent_comment_id: 1,
          },
        },
      },
      rawRequestCamelCase: {
        data: {
          attributes: {
            body: "new commentttt",
            type: "spam",
            author_id: 2,
            parentCommentId: 1,
          },
        },
      },
    },
    responses: {
      complete: {
        data: {
          id: 4,
          type: "comment",
          attributes: {
            body: "new commentttt",
            type: "spam",
          },
          links: { self: "/comment/4" },
          relationships: {
            author: {
              data: { id: 2, type: "user" },
              links: { self: "/comment/4/relationships/author", related: "/comment/4/author" }
            },
            parentComment: {
              data: { id: 1, type: "comment" },
              links: { self: "/comment/4/relationships/parentComment", related: "/comment/4/parentComment" }
            },
            article: {
              data: null,
              links: { self: "/comment/4/relationships/article", related: "/comment/4/article" }
            }
          },
        },
      },
      responseNoBody: {
        data: {
          id: 4,
          type: "comment",
          attributes: {
            body: null,
            type: "spam",
          },
          links: {
            self: "/comment/4"
          },
          relationships: {
            author: {
              data: {
                id: 2,
                type: "user",
              },
              links: {
                self: "/comment/4/relationships/author",
                related: "/comment/4/author"
              }
            },
            parentComment: {
              data: {
                id: 1,
                type: "comment",
              },
              links: {
                self: "/comment/4/relationships/parentComment",
                related: "/comment/4/parentComment"
              }
            },
            article: {
              data: null,
              links: { self: "/comment/4/relationships/article", related: "/comment/4/article" }
            }
          },
        },
      },
      responseNoParentComment: {
        data: {
          id: 4,
          type: "comment",
          attributes: {
            body: "new commentttt",
            type: "spam",
          },
          links: {
            self: "/comment/4"
          },
          relationships: {
            author: {
              data: {
                id: 2,
                type: "user",
              },
              links: {
                self: "/comment/4/relationships/author",
                related: "/comment/4/author"
              }
            },
            parentComment: {
              data: null,
              links: {
                self: "/comment/4/relationships/parentComment",
                related: "/comment/4/parentComment"
              }
            },
            article: {
              data: null,
              links: { self: "/comment/4/relationships/article", related: "/comment/4/article" }
            }
          },
        },
      },
    },
  },
  toUpdate: {
    attributeAndRelationship: {
      request: {
        data: {
          type: "comment",
          attributes: {
            body: "updated body",
            type: "spam",
          },
          relationships: {
            parentComment: {
              data: {
                id: 2,
                type: "comment",
              },
            },
            author: {
              data: {
                id: 2,
                type: "user",
              },
            },
            article: {
              data: null,
              links: { self: "/comment/4/relationships/article", related: "/comment/4/article" }
            }
          },
        },
      },
      response: {
        data: {
          id: 2,
          type: "comment",
          attributes: {
            body: "updated body",
            type: "spam",
          },
          links: {
            self: "/comment/2"
          },
          relationships: {
            author: {
              data: {
                id: 2,
                type: "user",
              },
              links: {
                self: "/comment/2/relationships/author",
                related: "/comment/2/author"
              }
            },
            parentComment: {
              data: {
                id: 2,
                type: "comment",
              },
              links: {
                self: "/comment/2/relationships/parentComment",
                related: "/comment/2/parentComment"
              }
            },
            article: {
              data: null,
              links: { self: "/comment/2/relationships/article", related: "/comment/2/article" }
            }
          },
        },
      },
    },
    removeRelationship: {
      request: {
        data: {
          type: "comment",
          attributes: {
            body: "updated body",
            type: "spam",
          },
          relationships: {
            parentComment: {
              data: {
                id: null,
                type: "comment",
              },
            },
            author: {
              data: {
                id: 2,
                type: "user",
              },
            },
            article: {
              data: null,
              links: { self: "/comment/4/relationships/article", related: "/comment/4/article" }
            }
          },
        },
      },
      requestForError: {
        data: {
          type: "comment",
          attributes: {
            body: "updated body",
            type: "spam",
          },
          relationships: {
            parentComment: {
              data: {
                id: 1,
                type: "comment",
              },
            },
            author: {
              data: {
                id: null,
                type: "user",
              },
            },
            article: {
              data: null,
              links: { self: "/comment/4/relationships/article", related: "/comment/4/article" }
            }
          },
        },
      },
      response: {
        data: {
          id: 2,
          type: "comment",
          attributes: {
            body: "updated body",
            type: "spam",
          },
          links: {
            self: "/comment/2"
          },
          relationships: {
            author: {
              data: {
                id: 2,
                type: "user",
              },
              links: {
                self: "/comment/2/relationships/author",
                related: "/comment/2/author"
              }
            },
            parentComment: {
              data: null,
              links: {
                self: "/comment/2/relationships/parentComment",
                related: "/comment/2/parentComment"
              }
            },
            article: {
              data: null,
              links: { self: "/comment/2/relationships/article", related: "/comment/2/article" }
            }
          },
        },
      },
    },
  },
  toGetReverseSorted: {
    data: [
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
            data: {
              id: 1,
              type: "user",
            },
            links: { self: "/comment/3/relationships/author", related: "/comment/3/author" }
          },
          parentComment: {
            data: null,
            links: { self: "/comment/3/relationships/parentComment", related: "/comment/3/parentComment" }
          },
          article: {
            data: null,
            links: { self: "/comment/3/relationships/article", related: "/comment/3/article" }
          }
        },
      },
      {
        id: 2,
        type: "comment",
        attributes: {
          body: "hello2",
          type: "not_spam",
        },
        links: { self: "/comment/2" },
        relationships: {
          author: {
            data: {
              id: 2,
              type: "user",
            },
            links: { self: "/comment/2/relationships/author", related: "/comment/2/author" }
          },
          parentComment: {
            data: {
              id: 3,
              type: "comment",
            },
            links: { self: "/comment/2/relationships/parentComment", related: "/comment/2/parentComment" }
          },
          article: {
            data: null,
            links: { self: "/comment/2/relationships/article", related: "/comment/2/article" }
          }
        },
      },
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
            data: {
              id: 1,
              type: "user",
            },
            links: { self: "/comment/1/relationships/author", related: "/comment/1/author" }
          },
          parentComment: {
            data: {
              id: 2,
              type: "comment",
            },
            links: { self: "/comment/1/relationships/parentComment", related: "/comment/1/parentComment" }
          },
          article: {
            data: null,
            links: { self: "/comment/1/relationships/article", related: "/comment/1/article" }
          }
        },
      },
    ],
  },
  singleCommentNoType: {
    data: {
      id: 1,
      type: "comment",
      attributes: {
        body: "hello",
      },
      links: { self: "/comment/1" },
      relationships: {
        author: {
          data: {
            id: 1,
            type: "user",
          },
          links: { self: "/comment/1/relationships/author", related: "/comment/1/author" }
        },
        parentComment: {
          data: {
            id: 2,
            type: "comment",
          },
          links: { self: "/comment/1/relationships/parentComment", related: "/comment/1/parentComment" }
        },
        article: {
          data: null,
          links: { self: "/comment/1/relationships/article", related: "/comment/1/article" }
        }
      },
    },
  },
  singleCommentWithReflexiveInclude: {
    data: {
      id: 1,
      type: "comment",
      attributes: { body: "hello", type: "not_spam" },
      links: { self: "/comment/1" },
      relationships: {
        parentComment: { data: { id: 2, type: "comment" } },
        author: { data: { id: 1, type: "user" } },
        article: { data: null, links: { self: "/comment/1/relationships/article", related: "/comment/1/article" } }
      },
    },
    included: [
      {
        id: 2,
        type: "comment",
        attributes: { body: "hello2", type: "not_spam" },
        links: { self: "/comment/2" },
        relationships: {
          author: { data: { id: 2, type: "user" } },
          parentComment: { data: { id: 3, type: "comment" } },
          article: { data: null, links: { self: "/comment/2/relationships/article", related: "/comment/2/article" } }
        },
      },
    ],
  },
};
