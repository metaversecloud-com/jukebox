import SearchResults from "@/components/SearchResults";
import Header from "@/components/Header";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { searchCatalog } from "@/context/actions";
import {
  RESET_SEARCH_RESULTS,
  SET_SEARCH_RESULTS,
  SET_SEARCH_LOADING,
  GENERATE_SKELETON,
  SET_NEXT_PAGE_LOADING,
  InitialState,
} from "@/context/types";
import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AxiosInstance } from "axios";

const Search: React.FC = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { searchTermGlobal, nextPageToken, searchLoading, nextPageLoading, backendAPI, searchResults, isAdmin } = useContext(
    GlobalStateContext,
  ) as InitialState;


  const [searchTerm, setSearchTerm] = useState(searchTermGlobal);
  const [lastSearchTerm, setLastSearchTerm] = useState(searchTermGlobal);
  const searchVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchLoading || searchTerm.trim() == "" || !isAdmin) return;
    setLastSearchTerm(searchTerm)
    dispatch!({ type: RESET_SEARCH_RESULTS });
    dispatch!({ type: GENERATE_SKELETON });

    dispatch!({ type: SET_SEARCH_LOADING, payload: { searchLoading: true } });
    const { searchResults, newNextPageToken } = await searchCatalog(backendAPI as AxiosInstance, searchTerm, "");
    dispatch!({ type: SET_SEARCH_RESULTS, payload: { searchResults, newNextPageToken, searchTermGlobal: searchTerm } });
  };

  const fetchNextPage = async () => {
    if (searchLoading || searchTerm == "" || nextPageLoading || nextPageToken === null) return;
    dispatch!({ type: SET_NEXT_PAGE_LOADING, payload: { nextPageLoading: true } });
    const { searchResults, newNextPageToken } = await searchCatalog(
      backendAPI as AxiosInstance,
      lastSearchTerm,
      nextPageToken,
    );
    dispatch!({ type: SET_SEARCH_RESULTS, payload: { searchResults, newNextPageToken } });
  };

  return (
    <>
      <Link to="/admin" className="p-1 border rounded-full hover:bg-[#f3f5f6] transition-colors self-start">
        <img src="left-arrow.svg" width={20} height={20} />
      </Link>
      <Header showAdminControls={false} />
      <div className="flex flex-col w-full justify-start">
        <p className="p2 !font-semibold my-2">Search YouTube</p>
        <form onSubmit={searchVideo} className="flex w-full justify-between items-center mt-1 mb-6">
          <input
            type="text"
            className="outline-[#0a2540] p-2 mr-2"
            id="search"
            name="search"
            value={searchTerm}
            autoComplete="off"
            autoFocus
            placeholder="Type here to search..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button disabled={searchLoading} className="btn btn-enhanced !w-fit">
            Search
          </button>
        </form>
        {searchResults.length > 0 && (
          <>
            <p className="p1 !font-semibold my-2">Search Results</p>
            <SearchResults loadNextSet={fetchNextPage} />
          </>
        )}
      </div>
    </>
  );
};

export default Search;
