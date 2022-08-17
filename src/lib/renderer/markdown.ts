import { emojis } from "$lib/renderer/emoji";
import hljs from "highlight.js";
import { marked } from "marked";
import DOMPurify from "dompurify";

export interface MarkdownResult {
    error: string | undefined,
    content: string | undefined
}

const escapeTest = /[&<>"']/;
const escapeReplace = /[&<>"']/g;
const escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
const escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;
const escapeReplacements: any = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};
const getEscapeReplacement = (ch: string) => escapeReplacements[ch];
export function escape(html: string, encode: boolean) {
  if (encode) {
    if (escapeTest.test(html)) {
      return html.replace(escapeReplace, getEscapeReplacement);
    }
  } else {
    if (escapeTestNoEncode.test(html)) {
      return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
    }
  }

  return html;
}

const renderer = {
    heading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6) {
        const escaped = text.toLowerCase().replace(/[^\w]+/g, '-');

        return (`
        <a name="${escaped}" class="flora-anchor" href="#${escaped}">
            <h${level}>
                ${text}
            </h${level}/>
        </a>
        `)
    },
    image(href: string, title: string | null, text: string) {
        href = cleanUrl(href)

        if (href === null) {
            return text;
        }

        const attributes = [
            `src="${href}"`,
            `alt="${text}"`
        ]

        if (title) {
            attributes.push(`title="${title}"`);
        }

        return (`
        <div class="m-auto flex flex-col gap-1 pb-2 text-sm text-slate-400 text-center">
            <a href="${href}" target="_blank" rel="external" class="hover:cursor-zoom-in">
                <img ${attributes.join(' ')}/>
            </a>
            ${text}
        </div>
        `)
    },
    link(href: string, title: string, text: string) {
        href = cleanUrl(href);

        if (href === null) {
            return text;
        }
        
        let out = '<a href="' + escape(href, false) + '" target="_blank" rel="external"';
        if (title) {
            out += ' title="' + title + '"';
        }

        out += '>' + text + '</a>';
        return out;
    }
}

marked.use({ renderer })

function displayLanguage(lang: string) {
    return (`<div class="pb-2 text-xs text-slate-400 select-none">${lang.slice(0, 1).toUpperCase() + lang.slice(1)}</div>`)
}

export function toHTML(text: string): MarkdownResult {
    try {
        return {
            content: DOMPurify.sanitize(marked(emojis(text), {
                smartypants: true,
                gfm: true,
                highlight: (code, lang) => {
                    if (lang == "" || !hljs.getLanguage(lang)) {
                        const automatic = hljs.highlightAuto(code);
                        return displayLanguage(automatic.language ?? 'unknown') + automatic.value;
                    }

                    return displayLanguage(lang) + hljs.highlight(code, {
                        language: lang,
                    }).value;
                },
                sanitizer: (html: string) => {
                    return DOMPurify.sanitize(html, {}) as string
                }
            }), { ADD_ATTR: ['target'] }),
            error: undefined
        }
    } catch (error: any) {
        return {
            error: error.message,
            content: undefined
        }
    }
}

function cleanUrl(href: string | null) {
    if (href === null) {
        return null;
    }

    try {
        href = encodeURI(href).replace(/%25/g, '%');
    } catch (e) {
        return null;
    }
    return href;
}