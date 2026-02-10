
export const subParams = (params: URLSearchParams, ...ids: string[]) => {
  const subset = new URLSearchParams();
  ids.forEach((id) => {
    const v = params.get(id);
    if (v != null && v !== "") subset.set(id, v);
  });
  return subset.toString();
};