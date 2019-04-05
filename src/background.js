const requests = {},
  addAction = 'ACTION_ADD_VIDEO',
  removeAction = 'ACTION_REMOVE_VIDEO_BY_VIDEO_ID';

function onBeforeRequestCallback(request) {
  const payload = request.requestBody.formData.sej[0];
  const action = payload.playlistEditEndpoint.actions[0];
  let newRequest = { action: action.action, tabId: request.tabId, playlistId: payload.playlistEditEndpoint.playlistId };

  switch (action.action) {
    case addAction:
      newRequest.videoId = action.addedVideoId;
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

  chrome.tabs.sendMessage(request.tabId, { videoId: request.videoId }, messageResponse => {
    const storageKey = `Playlist:${request.playlistId}`;

    chrome.storage.sync.get(storageKey, items => {
      const videos = items[storageKey] || {};

      switch (request.action) {
        case addAction:
          videos[request.videoId] = { name: messageResponse.videoName };
          break;
        case removeAction:
          delete videos[request.videoId];
          break;
      }

      chrome.storage.sync.set({ [storageKey]: videos });
    });
  });
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
