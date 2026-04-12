const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
dom.window.document.body.style.paddingRight = '1024px';
dom.window.document.body.style.paddingRight = '';
console.log(dom.window.document.body.style.paddingRight);
