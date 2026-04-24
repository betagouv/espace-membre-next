// Utility function to copy to clipboard
export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(
    () => {
      alert("Les emails ont été copiés dans le presse-papier");
    },
    (err) => {
      console.error("Impossible de copier le texte: ", err);
    },
  );
};
