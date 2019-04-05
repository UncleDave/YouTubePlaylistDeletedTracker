chrome.runtime.onMessage.addListener((message, sender, callback) => {
  const querySelector = `a#video-title[href^="/watch?v=${message.videoId}"]`;
  const element = document.querySelector(querySelector);
  callback({ videoName: element.textContent });
});
