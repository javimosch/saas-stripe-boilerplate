const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const requireFromString = require('require-from-string');

router.get('/:slug?', async (req, res) => {
  try {
    const articlesDir = path.join(__dirname, '../views/blog/articles');
    const currentLang = req.getLocale(); // Assuming you're using i18n middleware

    if (req.params.slug) {
      // Load specific article
      const articlePath = await findArticlePath(articlesDir, req.params.slug, currentLang);
      const metadataPath = path.join(articlesDir, `${req.params.slug}.js`);
      
      if (articlePath && await fs.pathExists(metadataPath)) {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata = requireFromString(metadataContent);
        
        res.render('blog/article', { 
          ...global.getEjsData(),
          article: req.params.slug,
          metadata: metadata,
          articlePath: articlePath//path.relative(path.join(__dirname, '../views'), articlePath)
          
        });
      } else {
        res.status(404).render('error', {...global.getEjsData(), message: 'Article not found' });
      }
    } else {
      // List all articles
      const articles = await fs.readdir(articlesDir);
      const articleList = [];
      
      for (const file of articles) {
        if (path.extname(file) === '.js') {
          const slug = path.basename(file, '.js');
          const metadataContent = await fs.readFile(path.join(articlesDir, file), 'utf-8');
          const metadata = requireFromString(metadataContent);
          const articlePath = await findArticlePath(articlesDir, slug, currentLang);
          if (articlePath) {
            articleList.push({ slug, ...metadata, lang: path.extname(articlePath).slice(1) || 'default' });
          }
        }
      }

      const metadata = {
        title: 'Our Blog | Integreria',
        description: 'Explore our latest articles on technology, integration, and software development.',
        author: 'Integreria Team',
        keywords: ['blog', 'technology', 'software development', 'integration', 'Integreria'],
        url: 'https://integreria.com/blog',
        image: 'https://integreria.com/images/blog-cover.jpg',
        publishedDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        section: 'Blog',
        tags: ['Technology', 'Software', 'Integration', 'Development'],
        articleCount: articleList.length,
      };
      
      res.render('blog/index', {...global.getEjsData(),title:'Blog', articles: articleList, metadata });
    }
  } catch (error) {
    console.error('Error loading blog articles:', error);
    res.status(500).render('error', { ...global.getEjsData(),message: 'Error loading blog articles' });
  }
});

async function findArticlePath(articlesDir, slug, lang) {
  const langSpecificPath = path.join(articlesDir, `${slug}.${lang}.ejs`);
  const defaultPath = path.join(articlesDir, `${slug}.ejs`);

  if (await fs.pathExists(langSpecificPath)) {
    return `${slug}.${lang}.ejs`;
  } else if (await fs.pathExists(defaultPath)) {
    return `${slug}.ejs`;
  }
  return null;
}

module.exports = router;