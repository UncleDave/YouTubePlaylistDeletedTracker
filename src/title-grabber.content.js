chrome.runtime.onMessage.addListener((message, sender, callback) => {
  if (!message.videoId)
    return;

  const querySelector = `a#video-title[href^="/watch?v=${message.videoId}"]`;
  const element = document.querySelector(querySelector);
  callback({ videoName: element.getAttribute('title') });
});
