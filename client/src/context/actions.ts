import { AxiosInstance } from "axios";
import { Video } from "./types";

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

const playVideo = async (backendAPI: AxiosInstance, video: Video, fromTrack: boolean) => {
  try {
    const result = await backendAPI.post("/play", { video, fromTrack });
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

export { searchCatalog, fetchCatalog, playVideo };
