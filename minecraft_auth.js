
$(document).ready(function() {
  checkForAuthRedirect()
  configurePage()
});



function checkForAuthRedirect() {
  const queryString = window.location.search;
  console.log(`query string is: ${queryString}`);
  const urlParams = new URLSearchParams(queryString);
  const microsoft_code = urlParams.get('code');
  if (microsoft_code != null) {

    console.log(`microsoft_code is ${microsoft_code}`);
    beginMinecraftLogin()
  }
}

function configurePage() {
  $('#login-microsoft').click(function() {
    beginMicrosoftLogin()
  });
}

function beginMicrosoftLogin() {
  $.ajax({
    url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/login/microsoft',
    method: 'POST',
    data: JSON.stringify({}),
    contentType: "application/json",
    dataType: "json",
    success: function(response) {
      console.log('Login successful:', response);
      login_data = response["login_data"];
      code_verifier = login_data["code_verifier"];
      login_url = login_data["login_url"];
      state = login_data["state"];

      localStorage.setItem('auth_code_verifier', code_verifier);
      localStorage.setItem('auth_state', state);

      // Redirect the user to another URL
      window.location.href = login_url;

    },
    error: function(xhr, status, error) {
      console.error('Login failed:', error);
    }
  });
}


function beginMinecraftLogin() {
  auth_code_verifier = localStorage.getItem('auth_code_verifier');
  auth_state = localStorage.getItem('auth_state');

  if (auth_code_verifier == null && auth_state == null) {
    console.log('We dont have code auth_code_verifier or auth_state so wont continue with minecraft login!');
    return
  }

  jsonObj = {
    'redirected_url': window.location.href,
    'auth_code_verifier': auth_code_verifier,
    'auth_state': auth_state
  }

  console.log(`the json obj for minecraft login is: ${jsonObj}`);

  $.ajax({
    url: 'https://minecraftmappy-5k3b37mzsa-ue.a.run.app/login/minecraft',
    method: 'POST',
    data: JSON.stringify(jsonObj),
    contentType: "application/json",
    dataType: "json",
    success: function(response) {
      console.log('Minecraft login successful:', response);
      minecraft_login_data = response["minecraft_login_data"];
      access_token = minecraft_login_data["access_token"];
      refresh_token = minecraft_login_data["refresh_token"];
      username = minecraft_login_data["username"];
      uuid = minecraft_login_data["uuid"];

      // Save acccess and refresh tokens to local storage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('username', username);
      localStorage.setItem('uuid', uuid);

      mapper_url = `https://www.whollyaigame.com/mapper`
      window.location.href = mapper_url
    },
    error: function(xhr, status, error) {
      console.error('Minecraft login failed:', error);
    }
  });
}
