import { backendAPI } from "@/utils/backendAPI";

const fetchCatalog = async (searchTerm: string, nextPageToken: string) => {
  try {
    const result = await backendAPI.post("/search", { q: searchTerm, nextPageToken});
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

export { fetchCatalog };
