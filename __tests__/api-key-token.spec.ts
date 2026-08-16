import { expect } from "chai";

import { generateApiKeyToken, hashApiKeyToken } from "@/lib/api-keys/token";
import { API_KEY_PREFIX, extractBearerToken } from "@/lib/api/bearer";

// La grammaire du CHECK chk_api_keys_token_prefix, recopiee telle quelle.
const TOKEN_PREFIX_CHECK = /^em1_[A-Za-z0-9_-]{8}$/;

describe("api key token", () => {
  it("generates a token, its hash and its reusable prefix", () => {
    const { token, tokenHash, tokenPrefix } = generateApiKeyToken();
    expect(token.startsWith(API_KEY_PREFIX)).to.be.true;
    expect(tokenPrefix).to.match(TOKEN_PREFIX_CHECK);
    expect(token.startsWith(tokenPrefix)).to.be.true;
    expect(tokenHash).to.have.length(64);
    expect(tokenHash).to.not.include(token);
  });

  it("hashes deterministically, so a token can be looked up by its hash", () => {
    const { token, tokenHash } = generateApiKeyToken();
    expect(hashApiKeyToken(token)).to.equal(tokenHash);
    expect(hashApiKeyToken(`${token}x`)).to.not.equal(tokenHash);
  });

  it("never generates twice the same token", () => {
    const tokens = new Set(
      Array.from({ length: 50 }, () => generateApiKeyToken().token),
    );
    expect(tokens.size).to.equal(50);
  });

  it("extracts a well formed Bearer token", () => {
    const { token } = generateApiKeyToken();
    expect(extractBearerToken(`Bearer ${token}`)).to.equal(token);
  });

  /**
   * Le middleware (Edge) et le wrapper (Node) doivent accepter exactement le
   * meme ensemble d'en-tetes. Les deux appellent extractBearerToken : cette
   * assertion verrouille la propriete, une divergence produirait un 401
   * silencieux au premier etage sur un jeton parfaitement valide.
   */
  it("accepts and refuses exactly the same headers on both stages", () => {
    const { token } = generateApiKeyToken();
    const cases: [string | null, boolean][] = [
      [`Bearer ${token}`, true],
      [`  Bearer ${token}  `, true], // trim
      [`Bearer  ${token}`, true], // espaces multiples
      [`bearer ${token}`, false], // casse du schema
      [`BEARER ${token}`, false],
      [`Bearer${token}`, false], // pas de separateur
      [` ${token}`, false], // schema absent
      [token, false],
      [`Bearer sk_${token.slice(4)}`, false], // hors prefixe em1_
      ["Bearer em1_court", false], // trop court
      ["Bearer ", false],
      ["", false],
      [null, false],
    ];

    for (const [header, accepted] of cases) {
      expect(
        extractBearerToken(header) !== null,
        `en-tete ${JSON.stringify(header)}`,
      ).to.equal(accepted);
    }
  });

  it("never lets a token through with characters outside the alphabet", () => {
    expect(extractBearerToken("Bearer em1_aaaa aaaa aaaa aaaa aaaa")).to.be.null;
    expect(extractBearerToken("Bearer em1_aaaaaaaaaaaaaaaaaaaa;drop")).to.be
      .null;
  });
});
