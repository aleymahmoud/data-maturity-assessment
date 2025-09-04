export const getBasePath = () => {
  return process.env.BASE_PATH || '';
};

export const createPath = (path) => {
  const basePath = getBasePath();
  return basePath + path;
};