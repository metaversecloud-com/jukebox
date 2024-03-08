import Catalog from "@/components/Catalog";
import Header from "@/components/Header";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { fetchCatalog } from "@/context/actions";
import { RESET_CATALOG, SET_CATALOG, SET_SEARCH_LOADING } from "@/context/types";
import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Search = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useContext(GlobalDispatchContext);
  const { nextPageToken, searchLoading, searchStatus } = useContext(GlobalStateContext);

  const currentPath = location.pathname;

  const searchVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchLoading || searchTerm == "") return;
    dispatch!({ type: SET_SEARCH_LOADING, payload: { searchLoading: true } });
    dispatch!({ type: RESET_CATALOG });
    const { catalog, newNextPageToken } = await fetchCatalog(searchTerm, "");
    dispatch!({ type: SET_CATALOG, payload: { catalog: catalog, newNextPageToken } });
  };

  const fetchNextPage = async () => {
    if (searchLoading || searchTerm == "") return;
    dispatch!({ type: "SET_SEARCH_LOADING", payload: { searchLoading: true } });
    const { catalog, newNextPageToken } = await fetchCatalog(searchTerm, nextPageToken);
    dispatch!({ type: "SET_CATALOG", payload: { catalog: catalog, newNextPageToken } });
  };

  return (
    <>
      {currentPath !== "/" && (
        <Link to="/" className="p-1 border rounded-full hover:bg-slate-50 self-start">
          <img src="left-arrow.svg" width={20} height={20} />
        </Link>
      )}
      <Header />
      <div className="flex flex-col w-full justify-start">
        <p className="p2 font-semibold my-2">Search the Catalog</p>
        <form onSubmit={searchVideo} className="flex w-full justify-between items-center mt-1 mb-6">
          <input
            type="text"
            className="p-2 mr-2"
            id="search"
            name="search"
            value={searchTerm}
            autoComplete="off"
            placeholder="Search for videos..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button disabled={searchLoading} className="btn btn-enhanced w-fit">
            Search
          </button>
        </form>
        <p className="p1 font-semibold my-2">Browse Catalog</p>
        <Catalog loadNextSet={fetchNextPage} />
      </div>
    </>
  );
};

export default Search;
