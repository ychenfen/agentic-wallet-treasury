import { describe, expect, it } from "vitest";
import { buildAgentURI, decodeDataAgentURI } from "../agent-uri.js";
import type { AgentRegistrationFile } from "../index.js";

const sample: AgentRegistrationFile = {
  type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  name: "Scout",
  description: "Test agent",
  image: "http://localhost/agents/scout.png",
  services: [{ name: "web", endpoint: "http://localhost:5175/" }],
  x402Support: false,
  active: true,
  registrations: [{ agentId: 8101, agentRegistry: "eip155:5003:0x8004A8..." }],
  supportedTrust: ["reputation"]
};

describe("buildAgentURI", () => {
  it("builds a base64 data URI in data mode", () => {
    const uri = buildAgentURI(sample, "researcher", { kind: "data" });
    expect(uri.startsWith("data:application/json;base64,")).toBe(true);
    const decoded = decodeDataAgentURI(uri);
    expect(decoded?.name).toBe("Scout");
    expect(decoded?.registrations[0].agentId).toBe(8101);
  });

  it("builds a hosted URI in hosted mode", () => {
    const uri = buildAgentURI(sample, "researcher", {
      kind: "hosted",
      baseUrl: "https://example.com/"
    });
    expect(uri).toBe("https://example.com/agents/researcher.json");
  });

  it("decodeDataAgentURI returns undefined for non-data URIs", () => {
    expect(decodeDataAgentURI("https://example.com")).toBeUndefined();
  });

  it("decodeDataAgentURI returns undefined for malformed base64", () => {
    expect(decodeDataAgentURI("data:application/json;base64,@@@@")).toBeUndefined();
  });
});
