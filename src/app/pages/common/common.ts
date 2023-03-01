import * as moment from 'moment';
import { cloneDeep} from 'lodash';
import { QueryResultsModel } from './models/query-results.model';
const { getCode } = require('country-list');
const LOCALES = [
    'af-ZA',
    'am-ET',
    'ar-AE',
    'ar-BH',
    'ar-DZ',
    'ar-EG',
    'ar-IQ',
    'ar-JO',
    'ar-KW',
    'ar-LB',
    'ar-LY',
    'ar-MA',
    'arn-CL',
    'ar-OM',
    'ar-QA',
    'ar-SA',
    'ar-SY',
    'ar-TN',
    'ar-YE',
    'as-IN',
    'az-Cyrl-AZ',
    'az-Latn-AZ',
    'ba-RU',
    'be-BY',
    'bg-BG',
    'bn-BD',
    'bn-IN',
    'bo-CN',
    'br-FR',
    'bs-Cyrl-BA',
    'bs-Latn-BA',
    'ca-ES',
    'co-FR',
    'cs-CZ',
    'cy-GB',
    'da-DK',
    'de-AT',
    'de-CH',
    'de-DE',
    'de-LI',
    'de-LU',
    'dsb-DE',
    'dv-MV',
    'el-GR',
    'en-029',
    'en-AU',
    'en-BZ',
    'en-CA',
    'en-GB',
    'en-IE',
    'en-IN',
    'en-JM',
    'en-MY',
    'en-NZ',
    'en-PH',
    'en-SG',
    'en-TT',
    'en-US',
    'en-ZA',
    'en-ZW',
    'es-AR',
    'es-BO',
    'es-CL',
    'es-CO',
    'es-CR',
    'es-DO',
    'es-EC',
    'es-ES',
    'es-GT',
    'es-HN',
    'es-MX',
    'es-NI',
    'es-PA',
    'es-PE',
    'es-PR',
    'es-PY',
    'es-SV',
    'es-US',
    'es-UY',
    'es-VE',
    'et-EE',
    'eu-ES',
    'fa-IR',
    'fi-FI',
    'fil-PH',
    'fo-FO',
    'fr-BE',
    'fr-CA',
    'fr-CH',
    'fr-FR',
    'fr-LU',
    'fr-MC',
    'fy-NL',
    'ga-IE',
    'gd-GB',
    'gl-ES',
    'gsw-FR',
    'gu-IN',
    'ha-Latn-NG',
    'he-IL',
    'hi-IN',
    'hr-BA',
    'hr-HR',
    'hsb-DE',
    'hu-HU',
    'hy-AM',
    'id-ID',
    'ig-NG',
    'ii-CN',
    'is-IS',
    'it-CH',
    'it-IT',
    'iu-Cans-CA',
    'iu-Latn-CA',
    'ja-JP',
    'ka-GE',
    'kk-KZ',
    'kl-GL',
    'km-KH',
    'kn-IN',
    'kok-IN',
    'ko-KR',
    'ky-KG',
    'lb-LU',
    'lo-LA',
    'lt-LT',
    'lv-LV',
    'mi-NZ',
    'mk-MK',
    'ml-IN',
    'mn-MN',
    'mn-Mong-CN',
    'moh-CA',
    'mr-IN',
    'ms-BN',
    'ms-MY',
    'mt-MT',
    'nb-NO',
    'ne-NP',
    'nl-BE',
    'nl-NL',
    'nn-NO',
    'nso-ZA',
    'oc-FR',
    'or-IN',
    'pa-IN',
    'pl-PL',
    'prs-AF',
    'ps-AF',
    'pt-BR',
    'pt-PT',
    'qut-GT',
    'quz-BO',
    'quz-EC',
    'quz-PE',
    'rm-CH',
    'ro-RO',
    'ru-RU',
    'rw-RW',
    'sah-RU',
    'sa-IN',
    'se-FI',
    'se-NO',
    'se-SE',
    'si-LK',
    'sk-SK',
    'sl-SI',
    'sma-NO',
    'sma-SE',
    'smj-NO',
    'smj-SE',
    'smn-FI',
    'sms-FI',
    'sq-AL',
    'sr-Cyrl-BA',
    'sr-Cyrl-CS',
    'sr-Cyrl-ME',
    'sr-Cyrl-RS',
    'sr-Latn-BA',
    'sr-Latn-CS',
    'sr-Latn-ME',
    'sr-Latn-RS',
    'sv-FI',
    'sv-SE',
    'sw-KE',
    'syr-SY',
    'ta-IN',
    'te-IN',
    'tg-Cyrl-TJ',
    'th-TH',
    'tk-TM',
    'tn-ZA',
    'tr-TR',
    'tt-RU',
    'tzm-Latn-DZ',
    'ug-CN',
    'uk-UA',
    'ur-PK',
    'uz-Cyrl-UZ',
    'uz-Latn-UZ',
    'vi-VN',
    'wo-SN',
    'xh-ZA',
    'yo-NG',
    'zh-CN',
    'zh-HK',
    'zh-MO',
    'zh-SG',
    'zh-TW',
    'zu-ZA'
];

function html2plain(html){
    const tempDivElement = document.createElement('div');
    tempDivElement.innerHTML = html;
    return tempDivElement.textContent || tempDivElement.innerText || '';
}
function str2url(str) {
    str = encodeURI(str);
    let link;
    try {
        link = new URL(str);
    } catch (error) {

    }
    if (link) {
        return link.href;
    } else {
        return null;
    }
}
function date2string(result, locale, format = 'datetime'): string {
    const date = new Date(result);
    if (format == 'datetime') {
        return date.toLocaleString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(', ', ', h:');
    } else if (format == 'day') {
        return date.toLocaleString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } else if (format == 'year') {
        return date.toLocaleString(locale, {
            year: 'numeric',
        });
    } else if (format == 'month') {
        return date.toLocaleString(locale, {
            year: 'numeric',
            month: '2-digit'
        });
    }
}

function number2string(nStr) {
    if (nStr == null) {
        return '';
    }
    if (typeof nStr != 'string') {
        nStr = Math.round((nStr + Number.EPSILON) * 100) / 100;
    }
    nStr += '';
    const comma = /,/g;
    nStr = nStr.replace(comma,'');
    const x = nStr.split('.');
    let x1 = x[0];
    const x2 = x.length > 1 ? '.' + x[1] : '';
    const rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return (x1 + x2).replace(/,/g, ';').replace(/\./g, ',').replace(/;/g, '.');
}
function tag2category(tag, lang = null) {
    const language = lang || localStorage.getItem('language') || 'it';
    if (!tag) {return '';}
    let name = tag.names.find( el =>el.language == language);
    name = name || tag.names.find( el => el.value && el.value != '');
    if (!name.value) {return '';}
    return name.value.split(',').map( el => {
        const a = el.trim();
        return a != ''? a.charAt(0).toUpperCase() + a.slice(1) : '';
    }).join(', ').split('&').map( el => {
        const a = el.trim();
        return a != ''? a.charAt(0).toUpperCase() + a.slice(1) : '';
    }).join(' & ');
}

function campaign2htmlData(campaign, wallets, user){

    let language;
    if (campaign.country) {
      language = getCode(campaign.country.toLowerCase().trim());
    }

    language = (language || localStorage.getItem('language') || 'it').toLowerCase();
    const locale = LOCALES.find( el => el.indexOf(language) == 0);
    const result = cloneDeep(campaign);

    switch( result.status) {
        case '3_funded':
            result.statusHTML = 'GENERAL.CLOSED_FUNDED';
            result.statusBgColor = '#797676';
            result.statusFontColor = '#FFFFFF';
            result.actionText = 'GENERAL.LEARN_MORE';
            result.icon = './assets/media/misc/map-marker.png';
            break;
        case '4_closed':
            result.statusHTML = 'GENERAL.CLOSED_NOT_FUNDED';
            result.statusBgColor = '#797676';
            result.statusFontColor = '#FFFFFF';
            result.actionText = 'GENERAL.LEARN_MORE';
            result.icon = './assets/media/misc/map-marker.png';
            break;
        case '2_comingsoon':
            result.statusHTML = 'GENERAL.COMINGSOON';
            result.statusBgColor = '#FFD33F';
            result.statusFontColor = '#262626';
            result.actionText = 'GENERAL.LEARN_MORE';
            result.icon = './assets/media/misc/map-marker-yellow.png';
            break;
        case '1_ongoing':
            result.statusHTML = 'GENERAL.ONGOING';
            result.statusBgColor = '#138800';
            result.statusFontColor = '#FFFFFF';
            result.actionText = 'GENERAL.LEARN_MORE';
            result.icon = './assets/media/misc/map-marker-green.png';
            break;
        case '5_extra':
            result.statusHTML = 'GENERAL.CLOSING';
            result.statusBgColor = '#FFD33F';
            result.statusFontColor = '#262626';
            result.actionText = 'GENERAL.LEARN_MORE';
            result.icon = './assets/media/misc/map-marker.png';
            break;
        case '6_refunded':
            result.statusHTML = 'GENERAL.REFUNDED';
            result.statusBgColor = '#797676';
            result.statusFontColor = '#FFFFFF';
            result.actionText = 'GENERAL.LEARN_MORE';
            result.icon = './assets/media/misc/map-marker.png';
            break;
        default:
            result.hidden = true;
    }
    if (result.raised != null && result.minimumGoal != null && result.minimumGoal > 0) {
        result.raisedPercent = Math.floor(result.raised * 100 / result.minimumGoal);
    }

    if (result.raisedPercent >= 100 && result.maximumGoal != null && result.maximumGoal > 0 && result.maximumGoal > result.minimumGoal) {
        result.raisedPercentByMaximumGoal = Math.floor((result.raised - result.minimumGoal) * 100 / (result.maximumGoal - result.minimumGoal));
    }

    if (result.equity) {
        result.equity = Math.round(result.equity * 100) / 100;
    }
    try {
        const tags = (result.company ? (result.company.tags || []): []).filter( el => el.confirmed);
        result.tags = tags;
        result.tagsTooltip = tags ? tags.map( el => tag2category(el, language)).join(' / ') : '';
        result.categories = tags ? tags.map( el => tag2category(el, language)) : [];
    } catch (error) {
        console.log(error);
    }

    if (result.source) {
        try {
            result.source.domain = new URL(result.source.link).host;
        } catch (error) {

        }
    }

    let socials = [];
    if (result.socials && result.socials.length > 0) {
        socials = result.socials;
    } else if (result.company && result.company.socials && result.company.socials.length > 0){
        socials = result.company.socials;
    }
    if (socials.length > 0) {
        result.socials = socials.filter( e => e).map( e => {
            if (e.indexOf('facebook') >= 0) {
                return {
                    link: e,
                    icon: 'socicon-facebook'
                };
            } else if  (e.indexOf('twitter') >= 0) {
                return {
                    link: e,
                    icon: 'socicon-twitter'
                };
            } else if  (e.indexOf('linkedin') >= 0) {
                return {
                    link: e,
                    icon: 'socicon-linkedin'
                };
            } else if  (e.indexOf('youtube') >= 0) {
                return {
                    link: e,
                    icon: 'socicon-youtube'
                };
            } else if  (e.indexOf('mailto') >= 0) {
                return {
                    link: e,
                    icon: 'socicon-mail'
                };
            } else if  (e.indexOf('instagram') >= 0) {
                return {
                    link: e,
                    icon: 'socicon-instagram'
                };
            } else {
                return null;
            }
        }).filter( e => e);
    }

    const regexpValidUrl =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    const webPage =  result.webPage || (result.company && result.company.webPageLink ? result.company.webPageLink: null);
    if (webPage && regexpValidUrl.test(webPage)) {
        result.webPage = webPage.indexOf('https://') >= 0 ? webPage : 'https://' + webPage;
    } else {
        result.webPage = null;
    }

    if (result.company && typeof result.company == 'object') {
        if (result.company.foundedDate) {
            result.company.foundedDate = date2string(result.company.foundedDate, locale);
        }

        if (result.company.campaigns && result.company.campaigns.length > 0) {
            result.company.campaigns = result.company.campaigns.filter ( c => c._id != result._id).map( c => {
                const cc: any = {};
                switch( c.status) {
                    case '3_funded':
                        cc.statusBgColor = '#797676';
                        cc.statusFontColor = '#FFFFFF';
                        break;
                    case '4_closed':
                        cc.statusBgColor = '#797676';
                        cc.statusFontColor = '#FFFFFF';
                        break;
                    case '2_comingsoon':
                        cc.statusBgColor = '#FFD33F';
                        cc.statusFontColor = '#262626';
                        break;
                    case '1_ongoing':
                        cc.statusBgColor = '#138800';
                        cc.statusFontColor = '#FFFFFF';
                        break;
                    default:
                        cc.hidden = true;
                };
                cc.link = '/crowdfunding/' + c.systemTitle;
                cc.name = c.name;
                return cc;
            });
        }
    }
    if (result.videoUrl) {
        const regexpValidUrl =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
        if (regexpValidUrl.test(result.videoUrl)) {
            result.videoUrl += result.videoUrl.indexOf('?') > 0 ? '&autoplay=1' : '?autoplay=1';
        } else {
            result.videoUrl = null;
        }
        if (result.videoUrl) {
            const youtubeUrlExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = result.videoUrl.match(youtubeUrlExp);
            if (match && match[2].length == 11) {
                result.videoUrl = 'https://www.youtube.com/embed/' + match[2] + '?feature=player_embedded&rel=0&autoplay=1';
            }
        }
    }


    if (result.startDate) {
        try {
            const remainHours = moment(result.startDate).diff(moment(), 'hours');
            if (remainHours >= 0) {
                result.startDateRemainDays = Math.trunc(remainHours / 24);
                result.startDateRemainHours = remainHours % 24;
            } else {
                result.startDateRemainDays = 0;
                result.startDateRemainHours = 0;
            }

            const date = new Date(result.startDate);
            result.startDateYear = date.getFullYear();
            result.startDateMonth = date.getMonth() + 1;
            result.startDateDay = date.getDate();
        } catch (error) {
        }

        result.startDate_ = date2string(result.startDate, locale, 'day');
    }

    if (result.endDate) {
        try {
            const date = new Date(result.endDate);
            result.endDateYear = date.getFullYear();
            result.endDateMonth = date.getMonth() + 1;
            result.endDateDay = date.getDate();
        } catch (error) {

        }
        result.endDate_ = date2string(result.endDate, locale, 'day');
    }

    result.link = str2url(result.link);

    if (result.descriptions && result.descriptions.find( el => el.language == language)) {
        result.description = result.descriptions.find( el => el.language == language).value;
    }
    if (result.description) {
        result.description = html2plain(result.description);
        result.description = result.description.toLowerCase().split('.').map( el => el.charAt(0).toUpperCase() + el.slice(1)).join('').substr(0,1000);
    }

    if (result.names && result.names.find( el => el.language == language)) {
        result.name = result.names.find( el => el.language == language).value;
    }
    if (result.roiAnnual) {
        result.roiAnnual = Math.round((result.roiAnnual + Number.EPSILON) * 100) / 100;
    }

    if (result.typology == 'real estate equity' || result.typology == 'real estate lending') {
        result.title = result.fullCity || result.city;
        if (result.title) {
            result.subTitle = result.name || result.fullAddress;
        } else {
            result.title = result.name;
            result.subTitle = result.fullAddress;
        }
    } else if (result.typology == 'minibond') {
        result.title = result.name;
        result.subTitle = result.tagsTooltip;
    } else {
        result.title = result.name;
        result.subTitle = result.tagsTooltip;
    }
    if (result.typology == 'company equity' || result.typology == 'real estate equity') {
        result.crowdfundingTypology = 'equity';
        result.fullMapUrl = '/crowdfunding?typology=equity&view=map';
    } else if (result.typology == 'real estate lending' || result.typology == 'company lending') {
        result.crowdfundingTypology = 'lending';
        result.fullMapUrl = '/crowdfunding?typology=lending&view=map';
    } else {
        result.crowdfundingTypology = 'minibond';
        result.fullMapUrl = '/crowdfunding?typology=minibond&view=map';
    }

    if (wallets) {
        const wallet = wallets.find( el => el.campaignId == result._id);
        result.wallet = wallet ? wallet._id: null;
    }

    result.followed = user && result.follows && result.follows.includes(user._id);


    ['raised', 'minimumGoal', 'maximumGoal', 'minimumInvestment', 'preMoneyEvaluation', 'investorCount'].forEach( key => {
        if (result[key]) {
            result[key] = number2string(result[key]);
        }
    });



    return result;
}
function str2videoUrl(param) {
    let result = param;
    const regexpValidUrl =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    if (regexpValidUrl.test(param)) {
        result += result.indexOf('?') > 0 ? '&autoplay=1&origin=' + window.location.origin : '?autoplay=1&origin=' + window.location.origin;
    } else {
        result = null;
    }
    if (result) {
        const youtubeUrlExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = result.match(youtubeUrlExp);
        if (match && match[2].length == 11) {
            result = 'https://www.youtube.com/embed/' + match[2] + '?feature=player_embedded&rel=0&autoplay=1&enablejsapi=1&origin=' + window.location.origin;
        }
    }
    if (result) {
        result = result.replace('loop=1','');
    }
    return result;
}


function str2number(param, delimiter = null) {
    try {
        if (typeof param === 'number') {
            return param;
        }
        if (typeof param === 'string') {
            let regex; let result;
            if (delimiter) {
                regex = new RegExp(`[^${delimiter}kmKM-\\d]`, 'g');
            } else {
                regex = new RegExp(`[^-kmKM\\d]`, 'g');
            }
            result = param.replace(regex, '');
            if (delimiter) {
                result = result.replace(delimiter, '.');
            }
            const lastChar = (result.length ? result[result.length - 1]: '').toLowerCase();
            if (delimiter) {
                result = parseFloat(result);
            } else {
                result = parseInt(result);
            }
            if (lastChar == 'm') {
              result = result * 1000000;
            } else if (lastChar == 'k') {
              result = result * 1000;
            }
            if (!isNaN(result)){
                return result;
            }
        }

    } catch (error) {
        console.log(error);
    }
    return null;
}
function str2date( param, format = null, dxDay = 0, language = 'it') {
    try {
        let m;
        if (param) {
            param = param.replace(/\s\s+/g, ' ').trim();

            param = param.replace('T1', '31 March');
            param = param.replace('T2', '30 June');
            param = param.replace('T3', '30 September');
            param = param.replace('T4', '31 December');
            param = param.replace('Q1', '30 April');
            param = param.replace('Q2', '31 August');
            param = param.replace('Q3', '31 December');

        }
        if (format == null) {
            m = moment(param).add({ days: dxDay});
        } else if (format == 'number') {
            const now = moment();
            const regex = new RegExp('([0-9]+)', 'g');
            const v = param.match(regex);

            m = now.add({
                days: v[0] ? str2number(v[0]) : 0,
                hours: v[1] ? str2number(v[1]) : 0,
                minutes: v[2] ? str2number([v[2]]) : 0
            }).add({ days: dxDay});
        } else {
            m = moment(param, format, language).add({ days: dxDay});
        }
        if (m.isValid()) {
            return m.toDate();
        }
    } catch (error) {
        console.log(error);
    }
    return null;
}


function baseFilter(_entities: any[], _params: any ): QueryResultsModel {
  let entitiesResult = cloneDeep(_entities);

  if (_params.sortField) {
    entitiesResult = sortArray(entitiesResult, _params.sortField, _params.sortOrder);
  }

  const totalCount = entitiesResult.length;
  const initialPos = _params.page * _params.pageSize;
  entitiesResult = entitiesResult.slice(initialPos, initialPos + _params.pageSize);

  const queryResults = new QueryResultsModel();
  queryResults.items = entitiesResult;
  queryResults.totalCount = totalCount;
  return queryResults;

}
function sortArray(_incomingArray: any[], _sortField: string = '', _sortOrder: string = 'asc'): any[] {
  if (!_sortField) {
    return _incomingArray;
  }

  let result: any[] = [];
  result = _incomingArray.sort((a, b) => {
    if (a[_sortField] < b[_sortField]) {
      return _sortOrder === 'asc' ? -1 : 1;
    }

    if (a[_sortField] > b[_sortField]) {
      return _sortOrder === 'asc' ? 1 : -1;
    }

    return 0;
  });
  return result;
}
export {
    html2plain,
    tag2category,
    number2string,
    str2url,
    date2string,
    campaign2htmlData,
    str2videoUrl,
    str2number,
    str2date,
    baseFilter,
    sortArray
};
