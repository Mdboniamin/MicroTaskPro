import axios from 'axios';

export const uploadImage = async (file: File) => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) {
    console.error("ImgBB API key is missing");
    return null;
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData);
    return response.data.data.url;
  } catch (error) {
    console.error("Error uploading image to ImgBB:", error);
    return null;
  }
};
