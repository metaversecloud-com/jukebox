import { AxiosInstance } from "axios";
import { Video } from "./types";

const searchCatalog = async (backendAPI: AxiosInstance, searchTerm: string, nextPageToken: string) => {
  try {
    const result = await backendAPI.post("/search", { q: searchTerm, nextPageToken });
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const fetchJukeboxDataObject = async (backendAPI: AxiosInstance) => {
  try {
    const result = await backendAPI.get("/jukebox");
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const checkIsAdmin = async (backendAPI: AxiosInstance) => {
  try {
    const result = await backendAPI.get("/is-admin");
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const addToCatalog = async (backendAPI: AxiosInstance, videos: Video[]) => {
  try {
    const result = await backendAPI.post("/add-media", { videos, type: "catalog" });
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const removeFromCatalog = async (backendAPI: AxiosInstance, videoIds: string[]) => {
  try {
    const result = await backendAPI.post("/remove-media", { videoIds, type: "catalog" });
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const addToQueue = async (backendAPI: AxiosInstance, videoIds: string[]) => {
  try {
    const result = await backendAPI.post("/add-media", { videos: videoIds, type: "queue" });
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const removeFromQueue = async (backendAPI: AxiosInstance, videoIds: string[]) => {
  try {
    const result = await backendAPI.post("/remove-media", { videoIds, type: "queue" });
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const checkInteractiveCredentials = async (backendAPI: AxiosInstance) => {
  try {
    const result = await backendAPI.get("/system/interactive-credentials");
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const skipToNextSong = async (backendAPI: AxiosInstance) => {
  try {
    const result = await backendAPI.post("/next");
    return result.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export {
  checkInteractiveCredentials,
  searchCatalog,
  fetchJukeboxDataObject,
  checkIsAdmin,
  addToCatalog,
  removeFromCatalog,
  addToQueue,
  removeFromQueue,
  skipToNextSong
};
