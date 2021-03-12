const marked = require('marked');
const juice = require('juice');

const css = `.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
}

.markdown-body::before {
  display: table;
  content: ""
}

.markdown-body::after {
  display: table;
  clear: both;
  content: "";
}

.markdown-body>*:first-child {
  margin-top: 0 !important;
}

.markdown-body>*:last-child {
  margin-bottom: 0 !important;
}

.markdown-body a:not([href]) {
  color: inherit;
  text-decoration: none;
}

.markdown-body p,
.markdown-body blockquote,
.markdown-body ul,
.markdown-body ol,
.markdown-body dl,
.markdown-body table,
.markdown-body pre {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body hr {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #e7e7e7;
  border: 0;
}

.markdown-body blockquote {
  padding: 0 1em;
  color: #777;
  border-left: 0.25em solid #ddd;
}

.markdown-body blockquote>:first-child {
  margin-top: 0;
}

.markdown-body blockquote>:last-child {
  margin-bottom: 0;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  padding-bottom: 0.3em;
  font-size: 2em;
  border-bottom: 1px solid #eee;
}

.markdown-body h2 {
  padding-bottom: 0.3em;
  font-size: 1.5em;
  border-bottom: 1px solid #eee;
}

.markdown-body h3 {
  font-size: 1.25em;
}

.markdown-body h4 {
  font-size: 1em;
}

.markdown-body h5 {
  font-size: 0.875em;
}

.markdown-body h6 {
  font-size: 0.85em;
  color: #777
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 2em
}

.markdown-body ul.no-list,
.markdown-body ol.no-list {
  padding: 0;
  list-style-type: none;
}

.markdown-body ul ul,
.markdown-body ul ol,
.markdown-body ol ol,
.markdown-body ol ul {
  margin-top: 0;
  margin-bottom: 0
}

.markdown-body li>p {
  margin-top: 16px
}

.markdown-body li+li {
  margin-top: 0.25em;
}


/* BETA overrides for accessibility ==> */

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  color: #53657D;
}

.markdown-body h1 {
  padding-bottom: 0;
  border-bottom: 5px solid #0053B3;
  color: #0053B3;
}

.markdown-body h2 {
  border-bottom: 3px solid #53657D;
}

/* for markdown-body */

.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  padding-top: 40px;
  padding-bottom: 40px;
  max-width: 758px;
overflow: visible !important;
}

.markdown-body figure {
  margin: 1em 40px;
}

.markdown-body img {
  background-color: transparent;
}
`;

module.exports.renderHtmlFromMd = function (content) {
  const toc = [];
  const rendererFunc = (function () {
    const renderer = new marked.Renderer();
    renderer.heading = function (text, level, raw) {
      const anchor = this.options.headerPrefix + raw.toLowerCase().replace(/[^\w\\u4e00-\\u9fa5]]+/g, '-');
      toc.push({
        anchor,
        level,
        text,
      });
      return `<h${
        level
      } id="${
        anchor
      }">${
        text
      }</h${
        level
      }>\n`;
    };
    return renderer;
  }());

  marked.setOptions({
    renderer: rendererFunc,
    // gfm: true,
    // tables: true,
    // breaks: false,
    // pedantic: false,
    // sanitize: true,
    // smartLists: true,
    // smartypants: false,
  });
  function build(coll, k, level, ctx) {
    if (k >= coll.length || coll[k].level <= level) { return k; }
    const node = coll[k];
    ctx.push(`<li><a href='#${node.anchor}'>${node.text}</a>`);
    k += 1;
    const childCtx = [];
    k = build(coll, k, node.level, childCtx);
    if (childCtx.length > 0) {
      ctx.push('<ul>');
      childCtx.forEach((idm) => {
        ctx.push(idm);
      });
      ctx.push('</ul>');
    }
    ctx.push('</li>');
    k = build(coll, k, level, ctx);
    return k;
  }
  let html = marked(content);
  const ctx = [];
  build(toc, 0, 0, ctx);
  // console.log(toc, ctx);
  html = html.replace('[TOC]', ctx.join(''));
  html = juice(`<style>
    ${css}
  </style><div id="doc" class="container markdown-body">${html}</div>`);
  return html;
};
