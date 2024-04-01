export function convertMillisToMinutes(milliseconds: number) {
  const remainingMilliseconds = milliseconds % (1000 * 60 * 60);
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor(remainingMilliseconds / (1000 * 60));
  const seconds = Math.floor((remainingMilliseconds % (1000 * 60)) / 1000);

  return `${hours ? hours + ":" : ""}${minutes < 10 && hours ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
