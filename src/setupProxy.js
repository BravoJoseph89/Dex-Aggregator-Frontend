const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
      headers: {
        'Content-Security-Policy': "default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval' 'unsafe-inline'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self' https: http: ws: wss:; " +
          "img-src 'self' data: content: https: http:; " +
          "media-src *; " +
          "font-src 'self' data: https: http:;"
      }
    })
  );
};
