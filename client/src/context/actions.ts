import { AxiosInstance } from "axios";

const searchCatalog = async (backendAPI: AxiosInstance, searchTerm: string, nextPageToken: string) => {
  try {
    const result = await backendAPI.post("/search", { q: searchTerm, nextPageToken });
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

const fetchCatalog = async (backendAPI: AxiosInstance) => {
  try {
    const result = await backendAPI.get("/catalog");
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

const playVideo = async (backendAPI: AxiosInstance, videoId: string) => {
  try {
    const result = await backendAPI.post("/play", { videoId });
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

export { searchCatalog, fetchCatalog, playVideo };
