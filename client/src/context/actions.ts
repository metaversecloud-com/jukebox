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

const playVideo = async (backendAPI: AxiosInstance, videoId: string) => {
  try {
    const result = await backendAPI.post("/play", { videoId });
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

const checkIsAdmin = async (backendAPI: AxiosInstance) => {
  try {
    const result = await backendAPI.get("/is-admin");
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

const addToQueue = async (backendAPI: AxiosInstance, videos: Video[]) => {
  try {
    const result = await backendAPI.post("/add-to-queue", { videos });
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

const removeFromQueue = async (backendAPI: AxiosInstance, videoIds: string[]) => {
  try {
    const result = await backendAPI.post("/remove-from-queue", { videoIds });
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

export { searchCatalog, fetchCatalog, playVideo, checkIsAdmin, addToQueue, removeFromQueue };
