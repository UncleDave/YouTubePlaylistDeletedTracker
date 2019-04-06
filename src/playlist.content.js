function refresh() {
  chrome.storage.sync.get(videos => {
    let videosChanged = false;

    document.querySelectorAll('#content>a.ytd-playlist-video-renderer').forEach(node => {
      const href = node.getAttribute('href');
      const hrefSearchString = href.split('?')[1];
      const hrefSearchParams = new URLSearchParams(hrefSearchString);
      const videoId = hrefSearchParams.get('v');
      const titleNode = node.querySelector('#video-title');
      const videoTitle = titleNode.getAttribute('title');

      const savedVideoName = videos[videoId];

      if (savedVideoName && videoTitle === '[Deleted video]') {
        const newNode = document.createElement('span');
        newNode.textContent = savedVideoName;
        newNode.style.fontWeight = 'normal';
        newNode.style.fontStyle = 'italic';
        titleNode.parentNode.append(newNode);
      }

      if (videoTitle === '[Deleted video]')
        return;

      const bylineNode = node.querySelector('#byline');
      const videoUploader = bylineNode.getAttribute('title');

      const updatedVideoName = `${videoUploader} - ${videoTitle}`;

      if (savedVideoName !== updatedVideoName) {
        videos[videoId] = updatedVideoName;
        videosChanged = true;
      }
    });

    if (videosChanged)
      chrome.storage.sync.set(videos);
  });
}

let observer;

chrome.runtime.onMessage.addListener((message) => {
  if (!message.refresh)
    return;

  const searchParams = new URLSearchParams(location.search);

  if (!searchParams.has('list'))
    return;

  if (observer)
    observer.disconnect();

  const contentsNode = document.querySelector('#contents.ytd-playlist-video-list-renderer');

  if (!contentsNode)
    return;

  observer = new MutationObserver(refresh);
  observer.observe(contentsNode, { childList: true });

  refresh();
});
