const marked = require('marked');

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
  return html;
};
