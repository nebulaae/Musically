import { cookies } from "next/headers"

export const getToken = async () => {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token');
        const isTokenExist = token ? true : false;

        return { token, isTokenExist };
    } catch (error) {
        console.error("Error getting token:", error);
        return null;
    }
}