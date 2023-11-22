import React from "react";

const FileUpload = ({ selectedFile, setSelectedFile }) => {
    const onFileChange = (event) => {
        // Update the state
        setSelectedFile(event.target.files[0]);
    };

    // File content to be displayed after
    // file upload is complete
    let url;
    if (selectedFile) {
        url = URL.createObjectURL(selectedFile);
    }

    const fileData = () => {
        if (url) {
            return (
                <>
                    <br />
                    <div style={{ height: 150, width: 240 }}>
                        <img
                            src={url}
                            style={{
                                height: "auto",
                                width: "auto",
                                maxWidth: "100%",
                                maxHeight: "100%",
                            }}
                        />
                    </div>
                    <a onClick={() => setSelectedFile(undefined)}>
                        supprimer 🗑️
                    </a>
                </>
            );
        } else {
            return;
        }
    };

    return (
        <div className="fr-input-group">
            <label className="fr-label" htmlFor="mission">
                Image
                <span className="fr-hint-text">
                    Une image rectangulaire au format 16/9 pour présenter le
                    produit (max: 10mo)
                </span>
            </label>
            {!selectedFile && (
                <div
                    style={{
                        //justifyContent: "center",
                        marginLeft: "auto",
                        marginRight: "auto",
                        display: "flex",
                        marginTop: "10px",
                    }}
                >
                    <input
                        id="file"
                        type="file"
                        onChange={onFileChange}
                        style={{
                            display: "none",
                        }}
                    />
                    <br></br>
                    <label
                        style={{
                            border: "1px dashed #ccc",
                            display: "inline-block",
                            padding: "6px 12px",
                            cursor: "pointer",
                        }}
                        htmlFor="file"
                    >
                        Selectionne une image rectangulaire
                    </label>
                </div>
            )}

            {fileData()}
        </div>
    );
};

export default FileUpload;
