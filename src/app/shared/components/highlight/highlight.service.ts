import {Injectable} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";

// import {isRTL} from "../../../infra/translation/translation-loader"; 
// COPIED FROM code\host\source\src_bootstrap_ts.c52827332bfd336c\src\app\infra\translation\translation-loader.ts
export const RTL_LANGUAGES = ['he', 'ar'];
export function isRTL(currentLang: string): boolean {
  return RTL_LANGUAGES.includes(currentLang);
}

// npm i --save-dev @types/lodash
import {sortBy,map,escapeRegExp,partition} from "lodash";

@Injectable({
  providedIn: 'root'
})
export class HighlightService {


  constructor(private translateService: TranslateService) { }


  public getTermRegexp(terms: string[]): RegExp {
    const finalRegs = [];
    if (!terms || terms.length==0) return new RegExp('', 'gi');
    const l_anchor = '(?:^|$|' + '[ \\n\\r\\t.,`@)(%~><}{\\[\\]\\\\\\/—“:;_&^#$%\'\\"\\+!?*=#|-]' + ')';
    const r_anchor = '(?=^|$|' + '[ \\n\\r\\t.,`@)(%~><}{\\[\\]\\\\\\/—”:;_&^#$%\'\\"\\+!?*=#|-]' + ')';
    const sortedTerms = sortBy(terms, (e: string) => -e.length);
    const escapedTerms = map(sortedTerms, escapeRegExp);
    const partitionedCjk = partition(escapedTerms, (e: string) => this.isCJK(e));
    if (partitionedCjk[0].length) {
      finalRegs.push('(' + partitionedCjk[0].join('|') + ')');
    }
    if (partitionedCjk[1].length) {
      const nonCjkRegs = map(partitionedCjk[1], (e: string) => e.trim().split(' ').join(' *?')).join("|");
      const nonCjkTerm = `(?:${l_anchor}(${nonCjkRegs})${r_anchor})`;
      finalRegs.push(nonCjkTerm);
    }

    const finalTerm = finalRegs.join('|');

    return new RegExp(finalTerm, 'gi');
  }

  private isCJK(text: string) {
    const cRegExp = /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/;
    const jRegExp = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;
    const koRegExp = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/;
    const vietRegExp = /[\u02C6-\u0323]/;

    return cRegExp.test(text) || jRegExp.test(text) || koRegExp.test(text) || vietRegExp.test(text);
  }

  private checkWithBoundaries(match: string, match1: string, match2: string) {
    const anchor = /[ \n\r\t.,`@)(%~><}{[\]\\/:;_&^#$%'"+!?*=#|-]/;
    const replaceText = match1 || match2;
    if (match.charAt(0).match(anchor)) {
      return match[0] + `<span class="text-bold-heavy ctm-highlight"><em class="font-style-normal">${replaceText}</em></span>`;
    }
    else {
      return `<span class="text-bold-heavy ctm-highlight"><em class="font-style-normal">${match}</em></span>`;
    }
  }


  public getHighlightedText(text: string, regexp: RegExp) {
    let highlighted = '';
    if (!text) {
      return '';
    }

    if(text.indexOf('<') !== -1 && !this.containsValidHTML(text)){
      text = text.replace(/</g,'&lt;');
      text = text.replace(/>/g,'&gt;');
    } else if (text.indexOf('<') !== -1 && this.containsHighlightTag(text)) {
      return text;
    }

    if (regexp) {
      if (this.isCJK(text)) {
        highlighted = text.replace(regexp, (match) => `<span class="text-bold-heavy ctm-highlight">${match}</span>`).replace(/<\/span> <span class="text-bold-heavy ctm-highlight">/g, ' ');
      } else {
        highlighted = text.replace(regexp, this.checkWithBoundaries).replace(/<\/span> <span class="text-bold-heavy ctm-highlight">/g, ' ');
      }
    } else {
      highlighted = text;
    }

    return highlighted;
  }

  private determineDirection(text: string) {
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]+/; // Hebrew (0590-05FF), Arabic (0600-06FF)
    const neutralRegex = /[\d\s()[\].,:;!?]+/; // Punctuation, digits, and neutral characters
    for (const char of text) {
      if (rtlRegex.test(char)) return 'rtl';
      if (!neutralRegex.test(char)) return 'ltr';
    }
    return null;
  }

  public bidirectionalText(strArray: string) {
    const rtlLang = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    const ltrLang = /[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]/;
    const bidiChars = /[\u202A-\u202B\u202C-\u202E\u2066-\u2069\u200E-\u200F\u061C-\u061C]/g;
    const dirDefinedInData = /.*dir.*=.*["|'](ltr|rtl|auto)["|'].*/;
    const rtlChars = /[\u200F]/g;
    const ltrChars = /[\u200E]/g;
    const resEmpty = {fixedStr: strArray, isBidi: false};

    if (bidiChars.test(strArray) || dirDefinedInData.test(strArray)) {
      return resEmpty;
    }

    //if we are in ltr and no rtl characters - no need to do anything
    if (!rtlLang.test(strArray) && !isRTL(this.translateService.currentLang)) {
      return resEmpty;
    }

    //if we are in rtl and no ltr characters - no need to do anything
    if (rtlLang.test(strArray) && !ltrLang.test(strArray)) {
      return resEmpty;
    }

    strArray = strArray || '';
    if (this.containsValidHTML(strArray)) {
      return resEmpty
    }

    const blocks = strArray.split(/(\s+)/).filter(block => block !== '');
    const mergedBlocks = [];
    let currentBlock: { block: string; direction: string, htmlWithDirection?: string } = {block: '', direction: ''};

    blocks.forEach(block => {
      const direction = this.determineDirection(block);
      if (direction && currentBlock.direction !== direction) {
        if (currentBlock.block) mergedBlocks.push(currentBlock);
        currentBlock = {block, direction};
      } else {
        currentBlock.block += block;
        currentBlock.direction = direction || currentBlock.direction;
      }
    });

    if (currentBlock.block) mergedBlocks.push(currentBlock);

    const result = mergedBlocks;
    let strongIndication = 'ltr';
    if (result.length > 1) {
      strongIndication = result[0].direction;
      result[0].htmlWithDirection = `<span dir='${strongIndication}'>${result[0].block}`;
      for (let i = 1; i < result.length; i++) {
        if (result[i].direction !== strongIndication) {
          if (result[i].block.lastIndexOf(' ') == result[i].block.length - 1 && i < result.length - 1) {
            result[i].block = result[i].block.substring(0, result[i].block.length - 1);
            result[i + 1].block = ' ' + result[i + 1].block;
          }
          result[i].htmlWithDirection = `<span dir='${result[i].direction}'>${result[i].block}</span>&nbsp;`;
        } else {
          result[i].htmlWithDirection = result[i].block;
        }
      }
      result[result.length - 1].htmlWithDirection += '</span>';

    }

    // Result
    const resultString = result.map(obj => obj.htmlWithDirection)  // Extract 'htmlWithDirection' property
      .filter(html => html !== undefined && html !== null)  // Remove undefined or null values
      .join('');

    if (resultString.length === 0) {
      return resEmpty;
    }

    let isBidi = false;
    if (rtlChars.test(resultString) && ltrChars.test(resultString)) {
      isBidi = true;
    }

    return {fixedStr: resultString, isBidi: isBidi};
  }

  /*
  * returns true if a text contains a valid HTML element
  */
  public containsValidHTML(text: string) {
    const htmlTags = /<(br|basefont|hr|input|source|frame|param|area|meta|!--|col|link|option|base|img|IMG|wbr|!DOCTYPE).*?>|<(a|abbr|acronym|address|applet|article|aside|audio|b|bdi|bdo|big|blockquote|body|button|canvas|caption|center|cite|code|colgroup|command|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frameset|head|header|hgroup|h1|h2|h3|h4|h5|h6|html|i|iframe|ins|kbd|keygen|label|legend|li|map|mark|menu|meter|nav|noframes|noscript|object|ol|optgroup|output|p|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video).*?<\/\2>/g;
    const containsValidHTML =  htmlTags.test(text.replace(/\r?\n|\r/gm, ''));
    return containsValidHTML;
  }

  /*
  * returns true if a text contains the highlight span
  */
  public containsHighlightTag(text: string) {
    const highlightTags = /<span class=["']text-bold-heavy ctm-highlight["'].*?<\/span>/g;
    const containsHighlightTag = highlightTags.test(text.replace(/\r?\n|\r/gm, ''));
    return containsHighlightTag;
  }

}
