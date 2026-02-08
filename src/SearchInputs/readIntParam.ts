export const readIntParam = (
  params: URLSearchParams,
  name: string,
  defaultValue: number) => {

  if (!params.has(name)) return defaultValue;
  let value = params.get(name);
  if (value === null) return defaultValue;
  try {
    return parseInt(value, 10);
  } catch (e) {
    return defaultValue;
  }
}