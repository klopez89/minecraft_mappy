function makeRedirectUrlCorrectForEnvironment(redirectUrl) {
  const searchString = 'www.whollyaigame.com';

  if (redirectUrl.includes(searchString) && !redirectUrl.includes(base_site_url)) {
    return redirectUrl.replace(searchString, base_site_url);
  }

  return redirectUrl;
}