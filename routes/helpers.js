const updateUrlQuery = function(query, value, url) {
  if (url.includes("?")) {
    if (url.includes(query)) {
      const pattern = new RegExp(`${query}=(.*)&`);
      return url.replace(pattern, `${query}=${value}&`);
    }
    return url + query + "=" + value + "&";
  }
  return url + "?" + query + "=" + value + "&";
};

module.exports = updateUrlQuery;
