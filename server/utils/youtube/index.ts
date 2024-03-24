// @ts-nocheck
const YTDurationToMilliseconds = (isoDurationString: string) => {
  const regex =
    /^P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?$/;

  const match = isoDurationString.match(regex);

  try {
    const years = parseFloat(match[1] || 0);
    const months = parseFloat(match[2] || 0);
    const weeks = parseFloat(match[3] || 0);
    const days = parseFloat(match[4] || 0);
    const hours = parseFloat(match[5] || 0);
    const minutes = parseFloat(match[6] || 0);
    const seconds = parseFloat(match[7] || 0);

    const milliseconds =
      years * 31536000000 +
      months * 2629800000 +
      weeks * 604800000 +
      days * 86400000 +
      hours * 3600000 +
      minutes * 60000 +
      seconds * 1000;

    return milliseconds;
  } catch (error) {
    console.error(`Error parsing ISO 8601 duration (${isoDurationString}):`, error);
    return 0;
  }
};

export { YTDurationToMilliseconds };
