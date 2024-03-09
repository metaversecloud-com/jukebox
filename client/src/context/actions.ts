import { backendAPI } from "@/utils/backendAPI";

const searchCatalog = async (searchTerm: string, nextPageToken: string) => {
  try {
    const result = await backendAPI.post("/search", { q: searchTerm, nextPageToken});
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

const fetchCatalog = async () => {
  try {
    const result = await backendAPI.get("/catalog");
    return result.data;
  } catch (error) {
    console.error(error);
  }
}

const playVideo = async (videoId) => {
  try {
    const result = await backendAPI.post("/play", {videoId});
    return result.data;
  } catch (error) {
    console.error(error);
  }
}

export { searchCatalog, fetchCatalog, playVideo };
