import { JsonApiSerializer } from "../test-app/kurier";

describe("Links feature", () => {
  it("should generate links", () => {
    // Create a serializer
    const serializer = new JsonApiSerializer();

    // Test resource link generation
    const resourceLinks = serializer.generateLinks("article", "1");
    expect(resourceLinks).toBeDefined();
    expect(resourceLinks.self).toBe("/article/1");

    // Test relationship link generation
    const relationshipLinks = serializer.generateLinks("article", "1", "author");
    expect(relationshipLinks).toBeDefined();
    expect(relationshipLinks.self).toBe("/article/1/relationships/author");
    expect(relationshipLinks.related).toBe("/article/1/author");
  });
});
