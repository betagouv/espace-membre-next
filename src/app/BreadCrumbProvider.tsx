"use client";
import React, { createContext, useState, useContext } from "react";

// Créer un contexte avec une valeur par défaut
const InfoContext = createContext({
    currentPage: "",
    setCurrentPage: (page: string) => {},
});

// Exporter un fournisseur de contexte
export const BreadCrumbProvider = ({ children }) => {
    const [currentPage, setCurrentPage] = useState("toto");

    return (
        <InfoContext.Provider value={{ currentPage, setCurrentPage }}>
            {children}
        </InfoContext.Provider>
    );
};

export const BreadCrumbFiller = ({ currentPage }) => {
    const { setCurrentPage } = useInfoContext();
    setCurrentPage(currentPage);
    return null;
};

// Hook personnalisé pour utiliser le contexte
export const useInfoContext = () => {
    return useContext(InfoContext);
};
