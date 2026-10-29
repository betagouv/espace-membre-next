import { expect } from "chai";
import sinon from "sinon";

import {
  getProConnectLogoutUrl,
  getRefusalFromLogoutState,
  getRefusalLogoutUrl,
} from "@/lib/auth/proConnectLogout";

describe("ProConnect logout", () => {
  beforeEach(() => {
    sinon.stub(process, "env").value({
      ...process.env,
      NEXT_PUBLIC_APP_BASE_URL: "https://espace-membre.example.fr",
      NEXT_PUBLIC_PRO_CONNECT_BASE_URL: "https://proconnect.example.fr",
    });
  });

  afterEach(() => sinon.restore());

  it("should send back to the /login declared at ProConnect", () => {
    const url = new URL(getProConnectLogoutUrl({ idToken: "id-token" }));
    expect(`${url.origin}${url.pathname}`).to.equal(
      "https://proconnect.example.fr/api/v2/session/end",
    );
    expect(url.searchParams.get("id_token_hint")).to.equal("id-token");
    expect(url.searchParams.get("post_logout_redirect_uri")).to.equal(
      "https://espace-membre.example.fr/login",
    );
    // a plain logout state is never read as a refusal
    expect(getRefusalFromLogoutState(url.searchParams.get("state"))).to.be.null;
  });

  it("should carry the refusal through the state", () => {
    const state = new URL(
      getRefusalLogoutUrl("SecondaryEmailNotAllowed", "id-token"),
    ).searchParams.get("state");
    expect(getRefusalFromLogoutState(state)).to.equal(
      "SecondaryEmailNotAllowed",
    );
    expect(getRefusalFromLogoutState("ExpiredMember-123")).to.be.null;
    expect(getRefusalFromLogoutState(null)).to.be.null;
  });
});
