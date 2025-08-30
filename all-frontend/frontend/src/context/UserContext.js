import { createContext } from 'react';

export const UserContext = createContext();

export const useUser = () => {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        return { userId: userInfo?.id ?? userInfo?.userId ?? null };
    } catch {
        return { userId: null };
    }
};
