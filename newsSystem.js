let newsArticles = [];

function postNews(title, content, authorName = "Admin") {
  const article = {
    id: newsArticles.length + 1,
    title: title,
    content: content,
    author: authorName,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString()
  };
  
  newsArticles.unshift(article);
  
  if (newsArticles.length > 20) {
    newsArticles = newsArticles.slice(0, 20);
  }
  
  return article;
}

function getLatestNews(count = 5) {
  return newsArticles.slice(0, count);
}

function getAllNews() {
  return newsArticles;
}

function formatNewsDisplay(article) {
  return `📰 **${article.title}**\n*By ${article.author} on ${article.date}*\n${article.content}`;
}

module.exports = {
  postNews,
  getLatestNews,
  getAllNews,
  formatNewsDisplay,
  newsArticles
};
