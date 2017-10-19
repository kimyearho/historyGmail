const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const path = require('path')
const url = require('url')
const electronOauth2 = require('electron-oauth2');

// 윈도우 객체를 전역에 유지합니다. 만약 이렇게 하지 않으면
// 자바스크립트 GC가 일어날 때 창이 멋대로 닫혀버립니다.
let mainWindow

// google auth2 설정
var config = {
  clientId: '548782842110-q2ulkkpmug2r1iq9r65pladgqj1jgloc.apps.googleusercontent.com',
  clientSecret: 'UyvPhortjl2ppSH3cOP0OKQY',
  authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://accounts.google.com/o/oauth2/token',
  useBasicAuthorizationHeader: false,
  redirectUri: 'http://localhost:8000'
};

function createWindow() {

  // 새로운 브라우저 창을 생성합니다.
  mainWindow = new BrowserWindow({ width: 1200, height: 550 })

  // 그리고 현재 디렉터리의 index.html을 로드합니다.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, './views/index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // 개발자 도구를 엽니다.
  mainWindow.webContents.openDevTools()

  // 창이 닫히면 호출됩니다.
  mainWindow.on('closed', function () {
    mainWindow = null
  })

}

// 이 메서드는 Electron의 초기화가 끝나면 실행되며 브라우저
// 윈도우를 생성할 수 있습니다. 몇몇 API는 이 이벤트 이후에만
// 사용할 수 있습니다.
app.on('ready', createWindow)

// 모든 창이 닫히면 애플리케이션 종료.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

// 클라이언트 구글 인증 통신
ipcMain.on('request-auth', (e, args) => {
  const windowParams = {
    alwaysOnTop: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false
    }
  }

  const options = {
    scope: 'https://www.googleapis.com/auth/gmail.readonly'
  };

  const myApiOauth = electronOauth2(config, windowParams);

  myApiOauth.getAccessToken(options)
    .then(token => {
      mainWindow.webContents.send('response-auth', { access_token: token.access_token })
      myApiOauth.refreshToken(token.refresh_token)
        .then(newToken => {
        });
    });
});