import httpClient from './httpClient'
export const handleRefreshToken = async () => {
    console.log("Token expired. Attempting to refresh token...");
    try {
        const response = await httpClient.get('refresh-token');
        return response;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const resetUser = (dispatch) => {
};
