const requests = {},
  addAction = 'ACTION_ADD_VIDEO',
  removeAction = 'ACTION_REMOVE_VIDEO_BY_VIDEO_ID';

function onBeforeRequestCallback(request) {
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

function onCompletedCallback(response) {
  const request = requests[response.requestId];

  if (response.statusCode !== 200 || !request)
    return;

  const storageKey = `playlist:${request.playlistId}`;

  chrome.storage.sync.get(storageKey, items => {
    const videos = items[storageKey] || {};

    switch (request.action) {
      case addAction:
        request.videoName.then(name => {
          videos[request.videoId] = name;
          chrome.storage.sync.set({ [storageKey]: videos });
        });
        break;
      case removeAction:
        delete videos[request.videoId];
        chrome.storage.sync.set({ [storageKey]: videos });
        break;
    }
  });

  delete requests[response.requestId];
}

const webRequestFilter = {
  urls: [
    '*://www.youtube.com/service_ajax?name=playlistEditEndpoint'
  ],
  types: [
    'xmlhttprequest'
  ]
};

chrome.webRequest.onBeforeRequest.addListener(onBeforeRequestCallback, webRequestFilter, ['requestBody']);
chrome.webRequest.onCompleted.addListener(onCompletedCallback, webRequestFilter);
