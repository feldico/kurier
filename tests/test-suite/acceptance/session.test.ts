import users from "./factories/user";
import testTransportLayer, { transportLayers } from "./helpers/transportLayers";

describe.each(transportLayers)("Transport Layer: %s", (transportLayer) => {
  const request = testTransportLayer(transportLayer);

  describe("Session", () => {
    it("POST", async () => {
      const sessionResponse = await request.post("/session").send(users.toAuthenticate.request);
      expect(sessionResponse.status).toEqual(201);
      expect(sessionResponse.body.data.id).toBeDefined();
      expect(sessionResponse.body.data.attributes.token).toBeDefined();
      expect(sessionResponse.body.data.type).toEqual("session");

      // Check links are present but don't compare exact content
      expect(sessionResponse.body.data.relationships.user.data).toEqual(users.toAuthenticate.response.data.relationships.user.data);
      expect(sessionResponse.body.data.relationships.user.links).toBeDefined();
      expect(sessionResponse.body.data.relationships.user.links.self).toMatch(/\/session\/[^/]+\/relationships\/user/);
      expect(sessionResponse.body.data.relationships.user.links.related).toMatch(/\/session\/[^/]+\/user/);
    });

    it("Login - Complete flow", async () => {
      const sessionResponse = await request.post("/session").send(users.toAuthenticate.request);
      const userId = sessionResponse.body.data.relationships.user.data.id;
      const token = `Bearer ${sessionResponse.body.data.attributes.token}`;
      const userResponse = await request.get(`/users/${userId}`).set("Authorization", token);
      expect(userResponse.status).toEqual(200);
      expect(userResponse.body).toEqual({ data: users.toGet[0] });
    });
  });
});
