import { expect } from "chai";

import { parseParticipantsCsv } from "./parseParticipantsCsv";

describe("parseParticipantsCsv", () => {
  it("should read a comma separated file with a header", () => {
    const { participants, ignored } = parseParticipantsCsv(
      "Nom,Email\nAda Lovelace,ada@beta.gouv.fr\nAlan Turing,alan@beta.gouv.fr",
    );
    expect(ignored).to.equal(0);
    expect(participants).to.deep.equal([
      { prenomNom: "Ada Lovelace", email: "ada@beta.gouv.fr" },
      { prenomNom: "Alan Turing", email: "alan@beta.gouv.fr" },
    ]);
  });

  it("should read a semicolon separated file, as exported by french Excel", () => {
    const { participants } = parseParticipantsCsv(
      "Prénom et Nom;Adresse mail\nAda Lovelace;ada@beta.gouv.fr",
    );
    expect(participants).to.deep.equal([
      { prenomNom: "Ada Lovelace", email: "ada@beta.gouv.fr" },
    ]);
  });

  it("should keep the first row when there is no header", () => {
    const { participants } = parseParticipantsCsv(
      "Ada Lovelace,ada@beta.gouv.fr\nAlan Turing,alan@beta.gouv.fr",
    );
    expect(participants).to.have.lengthOf(2);
    expect(participants[0].prenomNom).to.equal("Ada Lovelace");
  });

  it("should strip the BOM left by Excel so the header is recognised", () => {
    const { participants } = parseParticipantsCsv(
      "﻿Nom,Email\nAda Lovelace,ada@beta.gouv.fr",
    );
    expect(participants).to.deep.equal([
      { prenomNom: "Ada Lovelace", email: "ada@beta.gouv.fr" },
    ]);
  });

  it("should honour quotes around a name containing the separator", () => {
    const { participants } = parseParticipantsCsv(
      'Nom,Email\n"Lovelace, Ada",ada@beta.gouv.fr',
    );
    expect(participants[0].prenomNom).to.equal("Lovelace, Ada");
    expect(participants[0].email).to.equal("ada@beta.gouv.fr");
  });

  it("should follow the header order when columns are swapped", () => {
    const { participants } = parseParticipantsCsv(
      "Email,Nom\nada@beta.gouv.fr,Ada Lovelace",
    );
    expect(participants).to.deep.equal([
      { prenomNom: "Ada Lovelace", email: "ada@beta.gouv.fr" },
    ]);
  });

  it("should recover swapped columns even without a header", () => {
    const { participants } = parseParticipantsCsv(
      "ada@beta.gouv.fr,Ada Lovelace",
    );
    expect(participants).to.deep.equal([
      { prenomNom: "Ada Lovelace", email: "ada@beta.gouv.fr" },
    ]);
  });

  it("should accept a single column of emails", () => {
    const { participants } = parseParticipantsCsv(
      "ada@beta.gouv.fr\nalan@beta.gouv.fr",
    );
    expect(participants).to.deep.equal([
      { prenomNom: "", email: "ada@beta.gouv.fr" },
      { prenomNom: "", email: "alan@beta.gouv.fr" },
    ]);
  });

  it("should accept a single column of names", () => {
    const { participants } = parseParticipantsCsv("Ada Lovelace\nAlan Turing");
    expect(participants).to.deep.equal([
      { prenomNom: "Ada Lovelace", email: "" },
      { prenomNom: "Alan Turing", email: "" },
    ]);
  });

  it("should not swallow the first data row when it looks like a header", () => {
    // « Adresse » est un mot d'en-tête, mais la ligne porte un email : c'est une
    // vraie ligne de données.
    const { participants } = parseParticipantsCsv(
      "Adresse,ada@beta.gouv.fr\nAlan Turing,alan@beta.gouv.fr",
    );
    expect(participants).to.have.lengthOf(2);
  });

  it("should ignore blank lines and count rows without any value", () => {
    const { participants, ignored } = parseParticipantsCsv(
      "Nom,Email\nAda Lovelace,ada@beta.gouv.fr\n\n,\nAlan Turing,alan@beta.gouv.fr",
    );
    expect(participants).to.have.lengthOf(2);
    expect(ignored).to.equal(1);
  });

  it("should handle CRLF line endings", () => {
    const { participants } = parseParticipantsCsv(
      "Nom,Email\r\nAda Lovelace,ada@beta.gouv.fr\r\n",
    );
    expect(participants).to.have.lengthOf(1);
  });

  it("should cap the number of participants and count the overflow", () => {
    const rows = Array.from(
      { length: 5 },
      (_, i) => `Membre ${i},membre${i}@beta.gouv.fr`,
    ).join("\n");
    const { participants, ignored } = parseParticipantsCsv(rows, { max: 3 });
    expect(participants).to.have.lengthOf(3);
    expect(ignored).to.equal(2);
  });

  it("should return nothing for an empty file", () => {
    expect(parseParticipantsCsv("")).to.deep.equal({
      participants: [],
      ignored: 0,
    });
    expect(parseParticipantsCsv("\n\n  \n")).to.deep.equal({
      participants: [],
      ignored: 0,
    });
  });
});
