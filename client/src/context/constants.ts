export const skeleton = Array.from({ length: 3 }, () => {
  return {
    id: {
      videoId: "",
    },
    snippet: {
      title: "",
      publishedAt: "",
      thumbnails: {
        high: {
          url: "",
        },
      },
    },
    duration: "",
  };
});