/**

This code is from:
https://www.npmjs.com/package/google-tts-api

The MIT License (MIT)

Copyright (c) 2016 Leon Huang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


 */

(function(){

  var host = 'https://translate.google.cn';

  fetch('https://translate.google.cn').then(() => {
  }, () => {
    fetch('https://translate.google.com').then(() => {
      host = 'https://translate.google.com';
    })
  })


  var keyCache = null;

  /**
   * Get Key from https://translate.google.com
   *
   * @param   {Number!} timeout  default is 10000ms
   * @return  Promise(key: String)
   */
  function key(timeout) {
    if (keyCache) {
      return Promise.resolve(keyCache)
    }

    return fetch(host, {
      timeout: timeout || 10 * 1000
    })
    .then(function (res) {
      if (res.status !== 200) {
        throw new Error('request to ' + host + ' failed, status code = ' + res.status + ' (' + res.statusText + ')');
      }
      return res.text();
    })
    .then(function (html) {
      const expressions = [
        "TKK='(\\d+.\\d+)';",
        "tkk:'(\\d+.\\d+)'"
      ];

      const matches = expressions
        .map(expr => html.match(expr))
        .filter(res => res);

      if (!matches.length) throw new Error('get key failed from google');

      keyCache = matches[0][1];

      setTimeout(() => {//让keyCache半小时后失效
        keyCache = null
      }, 1000 * 60 * 60)

      return keyCache
    });
  };

  function XL (a, b) {
    for (var c = 0; c < b.length - 2; c += 3) {
      var d = b.charAt(c + 2);
      d = d >= 'a' ? d.charCodeAt(0) - 87 : Number(d);
      d = b.charAt(c + 1) == '+' ? a >>> d : a << d;
      a = b.charAt(c) == '+' ? a + d & 4294967295 : a ^ d;
    }
    return a;
  }

  /**
   * Generate API Token
   *
   * @param   {String} text
   * @param   {String} key
   * @return  {String} token
   */
  function token(text, key) {
    var a = text, b = key, d = b.split('.');
    b = Number(d[0]) || 0;
    for (var e = [], f = 0, g = 0; g < a.length; g++) {
      var m = a.charCodeAt(g);
      128 > m ? e[f++] = m : (2048 > m ? e[f++] = m >> 6 | 192 : (55296 == (m & 64512) && g + 1 < a.length && 56320 == (a.charCodeAt(g + 1) & 64512) ? (m = 65536 + ((m & 1023) << 10) + (a.charCodeAt(++g) & 1023),
      e[f++] = m >> 18 | 240,
      e[f++] = m >> 12 & 63 | 128) : e[f++] = m >> 12 | 224,
      e[f++] = m >> 6 & 63 | 128),
      e[f++] = m & 63 | 128);
    }
    a = b;
    for (f = 0; f < e.length; f++) {
      a += e[f];
      a = XL(a, '+-a^+6');
    }
    a = XL(a, '+-3^+b+-f');
    a ^= Number(d[1]) || 0;
    0 > a && (a = (a & 2147483647) + 2147483648);
    a = a % 1E6;
    return a.toString() + '.' + (a ^ b);
  };

  /**
   * Generate "Google TTS" audio download link
   *
   * @param   {String}  text   length should be less than 200 characters
   * @param   {String}  key
   * @param   {String!} lang   default is 'en'
   * @param   {Number!} speed  show = 0.24, default is 1
   * @return  {String}  url
   */
  function tts(text, key, lang, speed) {
    if (typeof text !== 'string' || text.length === 0) {
      throw new TypeError('text should be a string');
    }

    if (text.length > 200) {
      throw new RangeError('text length (' + text.length + ') should be less than 200 characters');
    }

    if (typeof key !== 'string' || key.length === 0) {
      throw new TypeError('key should be a string');
    }

    if (typeof lang !== 'undefined' && (typeof lang !== 'string' || lang.length === 0)) {
      throw new TypeError('lang should be a string');
    }

    if (typeof speed !== 'undefined' && typeof speed !== 'number') {
      throw new TypeError('speed should be a number');
    }
    return host + '/translate_tts?' + `ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&total=1&idx=0&textlen=${text.length}&tk=${token(text, key)}&client=t&prev=input&speed=1`
    // return host + '/translate_tts' + url.format({
    //   query: {
    //     ie: 'UTF-8',
    //     q: text,
    //     tl: lang || 'en',
    //     total: 1,
    //     idx: 0,
    //     textlen: text.length,
    //     tk: token(text, key),
    //     client: 't',
    //     prev: 'input',
    //     ttsspeed: speed || 1
    //   }
    // });
  };


  window.GoogleTTS = function GoogleTTS(text, lang, speed, timeout) {
    return key(timeout).then(function (key) {
      return tts(text, key, lang, speed);
    });
  };

})()