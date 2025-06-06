import config from "..";
import makeDS from "@/lib/ds";

interface Annotation {
  label: string;
  stringValue: string;
}

interface Dossier {
  dossier_url: string;
  state: string;
  dossier_id: string;
  dossier_number: number; // Assuming dossierInt is a number
  dossier_prefill_token: string;
  annotations: Annotation[];
}

const makeFakeMethods = () => {
  let dossierInt = 0;
  let dossiers: Dossier[] = [];
  return {
    getAllDossiersForDemarche: async (demarcheNumber) => {
      return dossiers;
    },
    getDossierForDemarche: async (dossierNumber) => {
      return dossiers.find(
        (d) => d.dossier_number === dossierNumber && d.state !== "prefilled",
      );
    },
    createPrefillDossier: async (demarcheNumber, {}) => {
      dossierInt = dossierInt + 1;
      const dossier = {
        dossier_url:
          "https://www.demarches-simplifiees.fr/commencer/demande?prefill_token=untoken",
        state: "prefilled",
        dossier_id: `${dossierInt}==`,
        dossier_number: dossierInt,
        dossier_prefill_token: "untoken",
        annotations: [
          {
            label: "Status",
            stringValue: "",
          },
        ],
      };
      dossiers.push(dossier);
      return dossier;
    },
  };
};
let DS_METHODS = makeFakeMethods();

if (process.env.NODE_ENV !== "test") {
  try {
    DS_METHODS = makeDS({
      DS_TOKEN: config.DS_TOKEN,
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
} else {
  console.log("DS wil use fake ds api.");
}

export default {
  ...DS_METHODS,
};
