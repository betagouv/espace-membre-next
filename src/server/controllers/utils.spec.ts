import { expect } from "chai";
import sinon from "sinon";
import axios from "axios";

import { isPublicServiceEmail } from "./utils";
import config from "@/server/config";

describe("isPublicServiceEmail", () => {
  let axiosGetStub: sinon.SinonStub;
  let originalTchapApi: string | undefined;

  beforeEach(() => {
    axiosGetStub = sinon.stub(axios, "get");
    originalTchapApi = config.tchap_api;
  });

  afterEach(() => {
    sinon.restore();
    config.tchap_api = originalTchapApi;
  });

  describe("direct domain matches (no API call)", () => {
    beforeEach(() => {
      config.tchap_api = undefined;
    });

    it("should return true for @pole-emploi.fr emails", async () => {
      const result = await isPublicServiceEmail("user@pole-emploi.fr");
      expect(result).to.be.true;
      expect(axiosGetStub.called).to.be.false;
    });

    it("should return true for @francetravail.fr emails", async () => {
      const result = await isPublicServiceEmail("user@francetravail.fr");
      expect(result).to.be.true;
      expect(axiosGetStub.called).to.be.false;
    });

    it("should return true for @france-travail.fr emails", async () => {
      const result = await isPublicServiceEmail("user@france-travail.fr");
      expect(result).to.be.true;
      expect(axiosGetStub.called).to.be.false;
    });

    it("should return true for @justice.fr emails", async () => {
      const result = await isPublicServiceEmail("user@justice.fr");
      expect(result).to.be.true;
      expect(axiosGetStub.called).to.be.false;
    });

    it("should return true for @*.gouv.fr emails", async () => {
      const result = await isPublicServiceEmail("user@education.gouv.fr");
      expect(result).to.be.true;
      expect(axiosGetStub.called).to.be.false;
    });

    it("should return true for subdomain gouv.fr emails", async () => {
      const result = await isPublicServiceEmail(
        "user@sub.ministry.gouv.fr",
      );
      expect(result).to.be.true;
      expect(axiosGetStub.called).to.be.false;
    });

    it("should handle uppercase emails", async () => {
      const result = await isPublicServiceEmail("User@POLE-EMPLOI.FR");
      expect(result).to.be.true;
    });

    it("should return false for non-public service emails when no Tchap API", async () => {
      const result = await isPublicServiceEmail("user@gmail.com");
      expect(result).to.be.false;
    });
  });

  describe("Tchap API integration", () => {
    beforeEach(() => {
      config.tchap_api = "https://tchap.example.com/api/";
    });

    it("should return true for internal Tchap users", async () => {
      axiosGetStub.resolves({ data: { hs: "agent.interne.tchap.gouv.fr" } });

      const result = await isPublicServiceEmail("user@custom-agency.fr");

      expect(result).to.be.true;
      expect(axiosGetStub.calledOnce).to.be.true;
      expect(axiosGetStub.firstCall.args[0]).to.equal(
        "https://tchap.example.com/api/user@custom-agency.fr",
      );
    });

    it("should return false for external Tchap users", async () => {
      axiosGetStub.resolves({
        data: { hs: "agent.externe.tchap.gouv.fr" },
      });

      const result = await isPublicServiceEmail("user@contractor.com");

      expect(result).to.be.false;
    });

    it("should return false on Tchap API error", async () => {
      axiosGetStub.rejects(new Error("Network error"));

      const result = await isPublicServiceEmail("user@unknown.fr");

      expect(result).to.be.false;
    });

    it("should not call Tchap API for direct domain matches", async () => {
      const result = await isPublicServiceEmail("user@interieur.gouv.fr");

      expect(result).to.be.true;
      expect(axiosGetStub.called).to.be.false;
    });
  });
});
