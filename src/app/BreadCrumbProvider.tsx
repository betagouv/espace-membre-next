"use client";
import { createContext, useState, useContext, useEffect } from "react";

// Créer un contexte avec une valeur par défaut
const InfoContext = createContext<{
    currentPage: string;
    setCurrentPage: (page: string) => void;
    currentItemId: string | null;
    setCurrentItemId: (id: string) => void;
}>({
    currentPage: "",
    setCurrentPage: (page: string) => {},
    currentItemId: null,
    setCurrentItemId: (id: string) => {},
});

// Exporter un fournisseur de contexte
export const BreadCrumbProvider = ({ children }) => {
    const [currentPage, setCurrentPage] = useState("/");
    const [currentItemId, setCurrentItemId] = useState<string | null>(null);

    return (
        <InfoContext.Provider
            value={{
                currentPage,
                setCurrentPage,
                currentItemId,
                setCurrentItemId,
            }}
        >
            {children}
        </InfoContext.Provider>
    );
};

export const BreadCrumbFiller = ({ currentPage, currentItemId }) => {
    const { setCurrentPage, setCurrentItemId } = useInfoContext();

    useEffect(() => {
        setCurrentPage(currentPage);
    }, [currentPage, setCurrentPage]);

    useEffect(() => {
        setCurrentItemId(currentItemId);
    }, [currentItemId, setCurrentItemId]);

    return null;
};

// Hook personnalisé pour utiliser le contexte
export const useInfoContext = () => {
    return useContext(InfoContext);
};
