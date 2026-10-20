import axios from "axios";

export const uploadImage = async (image) => {
    try {
        const formData = new FormData();
        formData.append("image", image);
        formData.append("subfolder", "news");
        const { data } = await axios.post(
            `${import.meta.env.VITE_IMAGE_SERVER_DOMAIN}/upload`,

            formData,

        );
        // const data = await res.json();
        return data;
    } catch (err) {
        return err;
    }
};
