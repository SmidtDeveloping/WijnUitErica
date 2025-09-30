// document.addEventListener('DOMContentLoaded', function () {
//     const usernames = ['insamekeen', 'insamekeen2'];
//     const videoGrid = document.getElementById('video-grid');

//     usernames.forEach(username => {
//         fetch(`https://api.example.com/tiktok/${username}/latest-videos`) // Vervang door de daadwerkelijke API URL
//             .then(response => response.json())
//             .then(data => {
//                 data.videos.forEach(video => {
//                     const videoItem = document.createElement('div');
//                     videoItem.className = 'video-item';
//                     videoItem.innerHTML = `
//                         <iframe src="${video.embed_url}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
//                     `;
//                     videoGrid.appendChild(videoItem);
//                 });
//             })
//             .catch(error => {
//                 console.error('Error fetching TikTok videos:', error);
//             });
//     });
// });
