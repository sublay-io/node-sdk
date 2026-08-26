import {
  createGrant,
  mintGrant,
  listGrants,
} from "../src/modules/reputation";
import { getMessage, listMessages } from "../src/modules/chat";
import { makeClient } from "./helpers/mockClient";

describe("node-sdk reputation — request shaping", () => {
  it("createGrant posts /reputation-grants with actingUserId as the sender and recipientId as the target", async () => {
    const { client, projectInstance } = makeClient();
    await createGrant(client, {
      actingUserId: "sender-1",
      recipientId: "recipient-1",
      amount: 25,
      spaceId: "space-1",
      note: "great answer",
      metadata: { source: "answer-card" },
      targetType: "comment",
      targetId: "comment-1",
    });
    expect(projectInstance.post).toHaveBeenCalledWith("/reputation-grants", {
      actingUserId: "sender-1",
      recipientId: "recipient-1",
      amount: 25,
      spaceId: "space-1",
      note: "great answer",
      metadata: { source: "answer-card" },
      targetType: "comment",
      targetId: "comment-1",
    });
  });

  it("createGrant keeps the server's field names — no targetUserId alias", async () => {
    const { client, projectInstance } = makeClient();
    await createGrant(client, {
      actingUserId: "sender-1",
      recipientId: "recipient-1",
      amount: 5,
    });
    const [, body] = projectInstance.post.mock.calls[0];
    expect(body).not.toHaveProperty("targetUserId");
    expect(body).not.toHaveProperty("userId");
  });

  it("mintGrant posts /reputation-grants/mint with no actor field", async () => {
    const { client, projectInstance } = makeClient();
    await mintGrant(client, {
      recipientId: "recipient-1",
      amount: 100,
      note: "weekly payout",
    });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/reputation-grants/mint",
      { recipientId: "recipient-1", amount: 100, note: "weekly payout" }
    );
    const [, body] = projectInstance.post.mock.calls[0];
    expect(body).not.toHaveProperty("actingUserId");
  });

  it("mintGrant forwards a negative amount unchanged (deductions are mint-only)", async () => {
    const { client, projectInstance } = makeClient();
    await mintGrant(client, { recipientId: "recipient-1", amount: -25 });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/reputation-grants/mint",
      { recipientId: "recipient-1", amount: -25 }
    );
  });

  it("listGrants gets /reputation-grants with the full filter as params", async () => {
    const { client, projectInstance } = makeClient();
    await listGrants(client, {
      recipientId: "recipient-1",
      page: 2,
      limit: 50,
      include: "user",
      spaceReputation: { spaceId: "context" },
    });
    expect(projectInstance.get).toHaveBeenCalledWith("/reputation-grants", {
      params: {
        recipientId: "recipient-1",
        page: 2,
        limit: 50,
        include: "user",
        spaceReputationId: "context",
      },
    });
  });

  it("listGrants flattens the spaceReputation object — never bracket-encoded", async () => {
    const { client, projectInstance } = makeClient();
    await listGrants(client, {
      senderId: "sender-1",
      spaceReputation: { spaceId: "space-1", includeDescendants: true },
    });
    expect(projectInstance.get).toHaveBeenCalledWith("/reputation-grants", {
      params: {
        senderId: "sender-1",
        spaceReputationId: "space-1",
        spaceReputationDescendants: true,
      },
    });
    const [, config] = projectInstance.get.mock.calls[0];
    expect(config.params).not.toHaveProperty("spaceReputation");
  });

  it("listGrants passes the target filter shape through", async () => {
    const { client, projectInstance } = makeClient();
    await listGrants(client, {
      targetType: "chat-message",
      targetId: "message-1",
    });
    expect(projectInstance.get).toHaveBeenCalledWith("/reputation-grants", {
      params: { targetType: "chat-message", targetId: "message-1" },
    });
  });
});

describe("node-sdk reputation — response mapping", () => {
  it("createGrant returns the created grant row bare (not wrapped)", async () => {
    const { client, projectInstance } = makeClient();
    const grant = { id: "grant-1", sourceType: "user", amount: 25 };
    projectInstance.post.mockResolvedValueOnce({ data: grant });
    await expect(
      createGrant(client, {
        actingUserId: "sender-1",
        recipientId: "recipient-1",
        amount: 25,
      })
    ).resolves.toEqual(grant);
  });

  it("listGrants returns the page envelope plus the summary block", async () => {
    const { client, projectInstance } = makeClient();
    const envelope = {
      data: [{ id: "grant-1" }],
      pagination: {
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 1,
        hasMore: false,
      },
      summary: { total: 120, count: 3, viewerTotal: 0 },
    };
    projectInstance.get.mockResolvedValueOnce({ data: envelope });
    await expect(
      listGrants(client, { targetType: "entity", targetId: "entity-1" })
    ).resolves.toEqual(envelope);
  });
});

describe("node-sdk reputation — client registration", () => {
  it("exposes the bound module on SublayClient (import / field / bindModule all wired)", async () => {
    // A module barrel that isn't imported in src/index.ts compiles cleanly and
    // is simply absent at runtime — this exercises all three edits at once.
    // The constructor is TS-private only; it exists at runtime.
    const { SublayClient } = await import("../src/index");
    const { client: http, projectInstance } = makeClient();
    const sublay = new (SublayClient as any)(http);

    expect(typeof sublay.reputation.createGrant).toBe("function");
    expect(typeof sublay.reputation.mintGrant).toBe("function");
    expect(typeof sublay.reputation.listGrants).toBe("function");

    await sublay.reputation.mintGrant({ recipientId: "r1", amount: 10 });
    expect(projectInstance.post).toHaveBeenCalledWith(
      "/reputation-grants/mint",
      { recipientId: "r1", amount: 10 }
    );
  });
});

describe("node-sdk reputation — chat grants include", () => {
  it("getMessage forwards include=grants (the Phase 3 single-message include)", async () => {
    const { client, projectInstance } = makeClient();
    await getMessage(client, {
      conversationId: "conversation-1",
      messageId: "message-1",
      userId: "u1",
      include: "grants",
    });
    const [url, config] = projectInstance.get.mock.calls[0];
    expect(url).toBe(
      "/chat/conversations/conversation-1/messages/message-1"
    );
    expect(config.params.include).toBe("grants");
  });

  it("listMessages accepts the composed files,grants include token", async () => {
    const { client, projectInstance } = makeClient();
    await listMessages(client, {
      conversationId: "conversation-1",
      userId: "u1",
      include: "files,grants",
    });
    const [, config] = projectInstance.get.mock.calls[0];
    expect(config.params.include).toBe("files,grants");
  });
});
