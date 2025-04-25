'use client'

import React, { createContext, useContext } from 'react';

interface TokenContextType {
    token: string | undefined;
    isTokenExist: boolean;
}

const TokenContext = createContext<TokenContextType | null>(null);

export const useToken = () => {
    const context = useContext(TokenContext);
    if (!context) {
        throw new Error("useToken must be used within a TokenProvider");
    }
    return context;
};

interface TokenProviderProps {
    children: React.ReactNode;
    token: string | undefined;
}

export const TokenProvider = ({ children, token }: TokenProviderProps) => {
    const isTokenExist = !!token;

    return (
        <TokenContext.Provider value={{ token, isTokenExist }}>
            {children}
        </TokenContext.Provider>
    );
};
