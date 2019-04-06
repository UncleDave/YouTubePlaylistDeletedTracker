const requests = {},
  addAction = 'ACTION_ADD_VIDEO',
  removeAction = 'ACTION_REMOVE_VIDEO_BY_VIDEO_ID';

function onBeforePlaylistEditRequestCallback(request) {
  const payload = JSON.parse(request.requestBody.formData.sej[0]);
  const action = payload.playlistEditEndpoint.actions[0];

  const newRequest = {
    action: action.action,
    playlistId: payload.playlistEditEndpoint.playlistId
  };

  switch (action.action) {
    case addAction:
      newRequest.videoId = action.addedVideoId;
      newRequest.videoName = new Promise(resolve => {
        chrome.tabs.sendMessage(request.tabId, { videoId: action.addedVideoId }, messageResponse => {
          resolve(messageResponse.videoName);
        });
      });
      break;
    case removeAction:
      newRequest.videoId = action.removedVideoId;
      break;
    default:
      return;
  }

  requests[request.requestId] = newRequest;
}

function onPlaylistEditCompletedCallback(response) {
  const request = requests[response.requestId];

  if (response.statusCode !== 200 || !request)
    return;

  chrome.storage.sync.get(videos => {
    switch (request.action) {
      case addAction:
        request.videoName.then(name => {
          if (!videos[request.videoId])
            chrome.storage.sync.set({ [request.videoId]: name });
        });
        break;
      case removeAction:
        chrome.storage.sync.remove(request.videoId);
        break;
    }
  });

  delete requests[response.requestId];
}

function sendRefreshMessage(details) {
  chrome.tabs.sendMessage(details.tabId, { refresh: true });
}

const playlistEditWebRequestFilter = {
  urls: [
    '*://www.youtube.com/service_ajax?name=playlistEditEndpoint'
  ],
  types: [
    'xmlhttprequest'
  ]
};

const navigationFilter = {
  url: [{
    pathEquals: '/playlist'
  }]
};

chrome.webRequest.onBeforeRequest.addListener(onBeforePlaylistEditRequestCallback, playlistEditWebRequestFilter, ['requestBody']);
chrome.webRequest.onCompleted.addListener(onPlaylistEditCompletedCallback, playlistEditWebRequestFilter);

chrome.webNavigation.onHistoryStateUpdated.addListener(sendRefreshMessage, navigationFilter);
chrome.webNavigation.onCompleted.addListener(sendRefreshMessage, navigationFilter);
