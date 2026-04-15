import Header from "@/components/Header";
import VideoInfoTile from "@/components/VideoInfoTile";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { removeFromCatalog, updateSettings } from "@/context/actions";
import { InitialState, JukeboxMode, REMOVE_FROM_CATALOG, SET_SETTINGS } from "@/context/types";
import { convertMillisToMinutes } from "@/utils/duration";
import { AxiosInstance } from "axios";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Admin = () => {
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [removeLoading, setRemoveLoading] = useState(false);

  const { backendAPI, catalog, isAdmin, settings } = useContext(GlobalStateContext) as InitialState;

  const dispatch = useContext(GlobalDispatchContext);

  const [mode, setMode] = useState<JukeboxMode>(settings?.mode ?? "karaoke");
  const [name, setName] = useState<string>(settings?.name ?? "");
  const [imageUrl, setImageUrl] = useState<string>(settings?.imageUrl ?? "");
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setMode(settings.mode);
      setName(settings.name);
      setImageUrl(settings.imageUrl);
    }
  }, [settings]);

  const handleRemoveFromCatalog = async () => {
    setRemoveLoading(true);
    const res = await removeFromCatalog(backendAPI as AxiosInstance, selectedVideoIds);
    if (res && res.success) {
      setSelectedVideoIds([]);
      dispatch!({
        type: REMOVE_FROM_CATALOG,
        payload: { videoIds: selectedVideoIds },
      });
    }
    setRemoveLoading(false);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSaveStatus(null);
    const res = await updateSettings(backendAPI as AxiosInstance, { mode, name, imageUrl });
    if (res && res.success) {
      dispatch!({ type: SET_SETTINGS, payload: { settings: res.settings } });
      setSaveStatus({ type: "success", message: "Settings saved." });
    } else {
      setSaveStatus({ type: "error", message: "Failed to save settings." });
    }
    setSavingSettings(false);
  };

  return (
    <>
      <Header showAdminControls={isAdmin} />
      <div className="flex flex-col w-full justify-start items-center pb-32">
        <h3 className="h3 self-start !mt-6 !mb-4">Settings</h3>

        <div className="flex flex-col w-full gap-3 mb-6">
          <div>
            <label htmlFor="jukebox-mode" className="p2 block mb-1">
              Mode
            </label>
            <select
              id="jukebox-mode"
              className="input w-full"
              value={mode}
              onChange={(e) => setMode(e.target.value as JukeboxMode)}
              disabled={savingSettings}
            >
              <option value="jukebox">Jukebox (no video, audio only)</option>
              <option value="karaoke">Karaoke (video and audio)</option>
            </select>
          </div>

          <div>
            <label htmlFor="jukebox-name" className="p2 block mb-1">
              Name
            </label>
            <input
              id="jukebox-name"
              type="text"
              className="input w-full"
              value={name}
              placeholder={mode === "jukebox" ? "Jukebox" : "Karaoke"}
              onChange={(e) => setName(e.target.value)}
              disabled={savingSettings}
            />
          </div>

          <div>
            <label htmlFor="jukebox-image-url" className="p2 block mb-1">
              Image URL
            </label>
            <input
              id="jukebox-image-url"
              type="text"
              className="input w-full"
              value={imageUrl}
              placeholder="https://..."
              onChange={(e) => setImageUrl(e.target.value)}
              disabled={savingSettings}
            />
          </div>

          {saveStatus && (
            <p className={`p3 ${saveStatus.type === "success" ? "text-success" : "text-error"}`}>{saveStatus.message}</p>
          )}

          <button className="btn btn-enhanced w-full" disabled={savingSettings} onClick={handleSaveSettings}>
            {savingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <h3 className="h3 self-start !mt-6 !mb-4">Catalog</h3>
        {selectedVideoIds.length > 0 && (
          <button
            disabled={removeLoading}
            onClick={handleRemoveFromCatalog}
            className="fixed right-5 bottom-5 btn btn-enhanced !w-fit z-10"
          >
            {!removeLoading ? `Remove (${selectedVideoIds.length})` : "Removing..."}
          </button>
        )}
        {catalog.length === 0 ? (
          <p className="text-start mb-2 w-full">No songs added</p>
        ) : (
          <div className="flex flex-col w-full justify-start items-center">
            {catalog.map((video, i) => (
              <div key={`${video.id.videoId}-${i}-tile`} className="my-2 w-full">
                <VideoInfoTile
                  isLoading={false}
                  videoId={video.id.videoId}
                  videoName={video.snippet.title}
                  videoDuration={convertMillisToMinutes(video.duration)}
                  videoExists={video.exists}
                  thumbnail={video.snippet.thumbnails.high.url}
                  videoInSelected={selectedVideoIds.find((v) => v === video.id.videoId) ? true : false}
                  showControls={{
                    plusminus:
                      selectedVideoIds.length > 0 && selectedVideoIds.find((v) => v === video.id.videoId)
                        ? "plus"
                        : "minus",
                  }}
                  addVideo={(videoId) => {
                    setSelectedVideoIds([...selectedVideoIds, videoId]);
                  }}
                  removeVideo={(videoId) => {
                    setSelectedVideoIds(selectedVideoIds.filter((v) => v !== videoId));
                  }}
                ></VideoInfoTile>
              </div>
            ))}
          </div>
        )}
        <div className="w-full h-14 bottom-0 left-0 fixed flex justify-center items-center bg-white">
          <Link to={"/search"} className="btn btn-enhanced !w-72">
            Add a Song
          </Link>
        </div>
      </div>
    </>
  );
};

export default Admin;
