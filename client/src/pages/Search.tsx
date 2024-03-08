import Catalog from "@/components/Catalog";
import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { fetchCatalog } from "@/context/actions";
import React, { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Search = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useContext(GlobalDispatchContext);
  const { nextPageToken } = useContext(GlobalStateContext);

  const currentPath = location.pathname;

  const searchVideo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { catalog, nextPageToken: newNextPageToken } = await fetchCatalog(searchTerm, nextPageToken);
    dispatch!({ type: "SET_CATALOG", payload: { catalog: catalog, nextPageToken: newNextPageToken } });
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
        <form onSubmit={searchVideo}>
          <input
            type="text"
            className="p-2 mt-1 mb-6"
            id="search"
            name="search"
            value={searchTerm}
            autoComplete="off"
            placeholder="Search for videos..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        <p className="p1 font-semibold my-2">Browse Catalog</p>
        <Catalog />
        <button
          className="p-2 my-4 bg-slate-700 text-white rounded-md"
          onClick={async () => await fetchCatalog(searchTerm, nextpageToken)}>Next Page</button>
      </div>
    </>
  );
};

export default Search;
