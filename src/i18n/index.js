module.exports = app => {

    const i18n = require('i18n');

    i18n.configure({
        locales: ['en', 'es', 'fr'],
        directory: __dirname + '/locales',
        defaultLocale: 'es',
        cookie: 'lang',
        objectNotation: true
    });

    app.use(i18n.init);

    app.use((req, res, next) => {
        if (req.session.lang) {
            req.setLocale(req.session.lang);
        }
        next();
    });

    app.get('/switch-lang/:lang', (req, res) => {
        const lang = req.params.lang;
        if (['en', 'es', 'fr'].includes(lang)) {
            req.session.lang = lang;
            req.setLocale(lang);
        }
        res.redirect('back');
    });
}