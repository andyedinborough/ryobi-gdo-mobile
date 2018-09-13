const isIsoDate = RegExp.prototype.test.bind(
  /^\d{4}(?:-\d\d){2}T\d\d(?::\d\d){2}(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)?$/
);

export const normalizeJson = (key: string, value: {}) => {
  if (typeof value === "string" && isIsoDate(value)) {
    return new Date(value);
  }

  if (value === null) {
    return undefined;
  }

  return value;
};

export const parseJson = async <T = {}>(
  response: Response | string
): Promise<T> => {
  const text = typeof response === "string" ? response : await response.text();
  const result = JSON.parse(text, normalizeJson);
  return result;
};
