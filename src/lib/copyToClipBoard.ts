export const copyToClipboard = (
  text: string,
  message = "Les emails ont été copiés dans le presse-papier",
) => {
  navigator.clipboard.writeText(text).then(
    () => {
      alert(message);
    },
    (err) => {
      console.error("Impossible de copier le texte: ", err);
    },
  );
};
