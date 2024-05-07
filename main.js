import { formatChatlog } from "./modules/convert_chatlog.mjs";
import { joinMessage } from "./modules/join_messages.mjs";
import { throttle, debounce } from "./modules/eventSkip.mjs";
import { participant, ogp_setting} from "./modules/data_struct.mjs";

const fileInput = document.querySelector("#js-input");
const codeChatlog = document.querySelector("#js-code");
const previewChatlog = document.querySelector("#js-preview");

const addParticipantButton = document.querySelector("#js-addButton");
const participantResister = document.querySelector("#js-participant-resister");
const participantRowTemplate = document.querySelector("#js-participant-template");

const downloadButton = document.querySelector("#js-download");

const dropZone = document.querySelector('#js-dropzone');

const regBeforeChatlog = /[\s\S]+<div class="chatlog-wrap">/;

const regAfterChatlog = /<[^<]+>\s*<div class="controll hidden">[\s\S]*/;

const regNotVoid = /\S+/g;

const toIndex = '<div class="to-index"><a href="#index">【目次へ戻る】</a></div>';

/* 入力として受け取ったHTMLファイルの中身を取得 */
const getHTML = (file) => {
  return new Promise((resolve) => {
    let fr = new FileReader();
    fr.onload = (e) => {
      resolve(e.currentTarget.result);
    };
    fr.readAsText(file);
  });
};

/* .chatlog以外の部分を除外 */
const removeNotChatlog = (htmlData) => {
  return htmlData.replace(regBeforeChatlog, '').replace(regAfterChatlog, '');
};

/* HTMLのチャットログ部分を抽出してタグ等に置換処理 */
const filterHTML = (htmlData) => {
  let chatlogs = htmlData.replaceAll('\n', '')
                         .replaceAll(/(<div class="main-logs">)/g, '$1\n')
                         .replaceAll("</div>", "</div>\n")
                         .split("\n").filter(el => el.trim());
  let str = formatChatlog(chatlogs).join('\n');
  return str;
};

/* プレビューへの反映 */
const reflectPreview = (code) => {
  previewChatlog.innerHTML = code;
  const sections = previewChatlog.querySelectorAll('section[class="chap"]');
  for (let i = 0; i< sections.length; i++) {
    sections[i].setAttribute('id', `sec-${i+1}`)
  }
};

const getParticipantsData = () => {
  const participants_list = participantResister.children;
  const participants = new Array();
  Array.prototype.forEach.call(participants_list, (el, i) => {
    const tmp_participant = Object.create(participant);
    tmp_participant.role = document.querySelector(`#${el.id} select[name="role"]`).value;
    tmp_participant.person_name = document.querySelector(`#${el.id} input[name="participant-name"]`).value;
    tmp_participant.personal_color = document.querySelector(`#${el.id} input[name="charactor-color"]`).value;
    tmp_participant.charactor_name = document.querySelector(`#${el.id} input[name="charactor-name"]`).value;
    tmp_participant.charactor_sheet = document.querySelector(`#${el.id} input[name="charactor-sheet"]`).value;
    tmp_participant.image_path = document.querySelector(`#${el.id} input[name="charactor-image"]`).value;
    tmp_participant.index = i;

    participants.push(tmp_participant);
  });
  return participants;
};

const getOGPData = () => {
  const ogp_data = Object.create(ogp_setting);
  ogp_data.title = document.querySelector("#session-title").value;
  ogp_data.description = document.querySelector("#session-description").value;
  ogp_data.url = document.querySelector("#ogp-url").value;
  ogp_data.site_name = document.querySelector("#ogp-site_name").value;
  return ogp_data;
};

const makePartsTemplate = async () => {
  const templates = [fetch('./templates/participant_list.html').then(r => r.text()),
                     fetch('./templates/charactor_list.html').then(r => r.text()),
                     fetch('./templates/index_section.html').then(r => r.text()),
                     fetch('./templates/index_preplay.html').then(r => r.text())];
  const [participant_list, charactor_list, index_section, index_preplay ] = await Promise.all(templates);
  return {
    participant: participant_list,
    charactor: charactor_list,
    index_section: index_section,
    index_preplay: index_preplay,
  };
};

const makeStyleTemplate = async () => {
  const resetstyle = fetch('./templates/css/reset.css').then(r=>r.text());
  const style = fetch('./templates/css/style.css').then(r=>r.text());
  const personal_style = fetch('./templates/css/personalstyle.css').then(r=>r.text());
  const personal_parts = fetch('./templates/css/personal_parts.css').then(r=>r.text());
  const personal_root = fetch('./templates/css/personal_parts_root.css').then(r=>r.text());

  const script = fetch('./templates/src/script.js').then(r=>r.text());
  const [res_reset, res_style, res_personal, res_personal_parts, res_personal_root, res_script] = await Promise.all([resetstyle, style, personal_style, personal_parts, personal_root, script]);
  return {
    reset: res_reset,
    sytle: res_style,
    personal: res_personal,
    personl_parts: res_personal_parts,
    personal_root: res_personal_root,
    script: res_script
  };
};

const makePersonalStyle = (participants, personal, personal_parts, personal_root) => {
  const define_colors = participants.map((el) =>
    personal_root.replace('{{ num }}', el.index).replace('{{ color }}', (el.personal_color ? el.personal_color : '#000'))
  ).join('\n');
  const parts = participants.map((el) =>
    personal_parts.replaceAll('{{ num }}', el.index)
  ).join('\n');
  return personal.replace('{{ define-colors }}', define_colors).replace('{{ parts }}', parts);
};

const makeIndex = (index_preplay, index_section) => {
  const sections = previewChatlog.querySelectorAll('section');
  const index_list = Array();
  for (let sec of sections){
    if(sec.classList.contains('preplay')){
      index_list.push(index_preplay.replace('{{ preplay-title }}', sec.querySelector('h2').textContent)
                                   .replace('{{ target-id }}', sec.id));
    } else if (sec.classList.contains('chap')){
      index_list.push(index_section.replace('{{ section-title }}', sec.querySelector('h2').textContent)
                                 .replace('{{ target-id }}', sec.id));
    }
  }
  return index_list.join('\n');
};

const makeParticipantsList = (partsTemplates, participants) => {
  return participants.map((el) =>
    partsTemplates.participant.replaceAll('{{ role-lowercase }}', el.role)
                              .replaceAll('{{ role }}', el.role.toUpperCase())
                              .replaceAll('{{ num }}', el.index)
                              .replaceAll('{{ participant-name }}', el.person_name)
                              .replaceAll('{{ charactor-name }}', el.charactor_name)
  );
};

const makeCharaList = (partsTemplates, participants) => {
  return participants.filter(el => el.charactor_name).map((el) =>
    partsTemplates.charactor.replaceAll('{{ num }}', el.index)
                            .replaceAll('{{ charactor-name }}', el.charactor_name)
                            .replaceAll('{{ charactor-sheet }}', el.charactor_sheet)
                            .replaceAll('{{ player-name }}', el.person_name)
                            .replaceAll('{{ image-src }}', el.image_path)
  );
};

const makeLogHTML = async (participants, ogp_data) => {
  const partsTemplates = await makePartsTemplate();
  const stylesTemplats = await makeStyleTemplate();

  const participantsHTML = makeParticipantsList(partsTemplates, participants);
  //キャラ名の欄が空ならキャラクターリストに入れないようにしている
  const charactorsHTML = makeCharaList(partsTemplates, participants);

  const indexHTML = makeIndex(partsTemplates.index_preplay, partsTemplates.index_section);

  const personal_style = makePersonalStyle(participants, stylesTemplats.personal, stylesTemplats.personl_parts, stylesTemplats.personal_root);
  let ret_data = fetch('./templates/template.html').then(r=>r.text()).then(t=>{
    const ret = t.replace('{{ url }}', ogp_data.url)
                 .replace('{{ site-description }}', ogp_data.description)
                 .replace('{{ site-name }}', ogp_data.site_name)
                 .replace('{{ site-description-tweet }}', ogp_data.description)
                 .replace('{{ reset }}', stylesTemplats.reset)
                 .replace('{{ personal }}', personal_style)
                 .replace('{{ style }}', stylesTemplats.sytle)
                 .replace('{{ script }}', stylesTemplats.script)
                 .replaceAll("{{ title }}", ogp_data.title)
                 .replace('{{ participants-list }}', participantsHTML.join('\n'))
                 .replace('{{ charactor-list }}', charactorsHTML.join('\n'))
                 .replace('{{ index }}', indexHTML)
                 .replace('{{ chatlogs }}', previewChatlog.innerHTML);
    return ret;
  });
  return ret_data;
};

const downloadHTML = (filename, data) => {
  const blob = new Blob([data]);
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();

  URL.revokeObjectURL(link.href);
};

/* 参加者欄を追加 */
const cloneParticipantRow = (e, selected_role="pl") => {
  const content = participantRowTemplate.content.cloneNode(true);
  const select_item = content.querySelector(".select-role");
  const input_list = content.querySelectorAll("div.input");
  const checkbox = content.querySelector("div.checkbox");
  const del_button = content.querySelector(".del > a");
  const identifier = `${Date.now()}-${participantResister.children.length}`;

  const participants_row = content.querySelector(".participants-row");


  select_item.children[0].attributes['for'].value = `role-${identifier}`;
  select_item.children[1].attributes['id'].value = `role-${identifier}`;
  select_item.children[1].querySelector(`option[value="${selected_role}"]`).setAttribute("selected", true);
  checkbox.children[1].attributes['for'].value = `get-data-${identifier}`;
  checkbox.children[0].attributes['id'].value = `get-data-${identifier}`;

  for (let i=0; i<input_list.length; i++) {
    const input_element = input_list[i].children[1].querySelector('input[id]');
    const base_id = input_element.attributes['id'].value;

    input_list[i].children[0].attributes['for'].value = `${base_id}-${identifier}`;
    input_element.attributes['id'].value = `${base_id}-${identifier}`;
    input_element.setAttribute("onchange", `reflectColor("${base_id}-${identifier}")`);
    if (base_id === "input-color") {
      console.log(input_element.parentNode.children["color-sample"]);
      const canvas_id = input_element.parentNode.children["color-sample"].attributes['id'].value;
      input_element.parentNode.children["color-sample"].attributes['id'].value = `${canvas_id}-${identifier}`
    }
  }

  participants_row.attributes['id'].value = `${participants_row.id}-${identifier}`;

  del_button.setAttribute('onclick', `deleteElement(\"${participants_row.id}\")`);

  participantResister.appendChild(content);
};

/* ファイル読み込み時の処理 */
fileInput.addEventListener('change', async (e) => {
  codeChatlog.value = '';
  const file = e.currentTarget.files[0];
  if (!file) return;
  const text = await getHTML(file);
  const chatlogs = removeNotChatlog(text);
  const filtered = filterHTML(chatlogs);
  codeChatlog.value = filtered;
  reflectPreview(filtered);
});

const regCommand = /\n\?==([a-z]{3}):([a-z]{2,})==\s*\n/;

const commandDo = (code) => {
  console.log(code);
  if (regCommand.test(code)) {
    const [command, input] = regCommand.exec(code).slice(1);
    if (command=="del" && input=="up") {
      return code.replace(/[\s\S\n]*\?==del:up==/, '');
    }
  } else {
    return code;
  }
};

const whenEdit = (code) => {

  const replaced = code.replaceAll(/(<div.+>)\n/g, '$1');

  const insertHeader = replaced.replaceAll(/\n\$\s(.+)\n/g, '\n<section class="preplay" id="chara-make"><h2>$1</h2><details><summary>クリックして$1を開く</summary>\n<div class="chatlog">\n')
                                .replaceAll(/\n#\s(.+)\n/g, '\n<section class="chap"><h2>$1</h2>\n<div class="chatlog">\n')
                                .replaceAll(/\n>{3,}\$\n/g, '\n</div></details></section>\n')
                                .replaceAll(/\n>{3,}#\n/g, '\n</div></section>\n')
                                .replaceAll(/\n>{3,}\$i\n/g, `\n</div></details>${toIndex}</section>\n`)
                                .replaceAll(/\n>{3,}#i\n/g, `\n</div>${toIndex}</section>\n`);

  const insertPics = insertHeader.replaceAll(/\n<&(?<comment>.*)@"(?<path>.*)";(?<alt>.*)&>\n/g, '\n<figure class="insert-pic"><img src="$<path>" alt="$<alt>"><figcaption>$<comment></figcaption></figure>\n')

  const splited = insertPics.split('\n').filter(val => regNotVoid.exec(val));

  reflectPreview(splited.join('\n'));

};

/* textareaの文字列が編集された時の処理 */
/**
 * 文法
 * 上下に空行のある`# ○○○`：セクション見出しの指定
 * >>>#：セクション閉じ位置指定（>は3個以上ならいくつでも）
 * 上下に空行のある`$ ○○○`：プリプレイセクション見出しの指定
 * >>>$：プリプレイ閉じ位置指定（>は3個以上ならいくつでも）
 * >>>[#$]i：閉じ位置指定の直前に「目次へ戻る」リンクを設置
 * 上下に空行のある<& comment @"img_path"?"altテキスト"&/>：画像の挿入指定
 * 上下に空行のある?==del:up==：【制御コマンド】そこから上の行は全削除
 */



// コマンドはフォーカスが外れた時に実行
codeChatlog.addEventListener('change', () => {
  codeChatlog.value = commandDo(codeChatlog.value);
  whenEdit(codeChatlog.value);
});


codeChatlog.addEventListener('input', (e) => {
  debounce(() => whenEdit(e.target.value), 500)();
});

addParticipantButton.addEventListener('click', cloneParticipantRow);


downloadButton.addEventListener('click', async (e) => {
  const participants = getParticipantsData();
  const ogp_data = getOGPData();
  const data = await makeLogHTML(participants, ogp_data);
  downloadHTML(`${ogp_data.title}-log.html`, data);
}, false);

document.querySelector('#js-download-part').addEventListener('click', async (e) => {
  const participants = getParticipantsData();
  const ogp_data = getOGPData();
  const partsTemplates = await makePartsTemplate();
  const data = makeParticipantsList(partsTemplates, participants).join('\n');
  downloadHTML(`${ogp_data.title}-participants.html`, data);
}, false);

document.querySelector('#js-download-chara').addEventListener('click', async (e) => {
  const participants = getParticipantsData();
  const ogp_data = getOGPData();
  const partsTemplates = await makePartsTemplate();
  const data = makeCharaList(partsTemplates, participants).join('\n');
  downloadHTML(`${ogp_data.title}-charactors.html`, data);
}, false);

document.querySelector('#js-download-index').addEventListener('click', async (e) => {
  const ogp_data = getOGPData();
  const partsTemplates = await makePartsTemplate();
  const data = makeIndex(partsTemplates.index_preplay, partsTemplates.index_section);
  downloadHTML(`${ogp_data.title}-index.html`, data);
}, false);

document.querySelector('#js-download-main').addEventListener('click', async (e) => {
  const ogp_data = getOGPData();
  const data = await fetch('./templates/main_logs.html').then(r=>r.text()).then(t=>{
    const ret = t.replace('{{ chatlogs }}', previewChatlog.innerHTML);
    return ret;
  });
  downloadHTML(`${ogp_data.title}-mainlogs.html`, data);
}, false);

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if(file !== 'undefined') {
    fileInput.file = file;
    if (!file) return;
    const text = await getHTML(file);
    const chatlogs = removeNotChatlog(text);
    const filtered = filterHTML(chatlogs);
    codeChatlog.value = filtered;
    reflectPreview(filtered);
  } else {
    // pass
  }
});



/* ページロード時に自動的に列を生成するようにする */
cloneParticipantRow(null, "gm");
[...Array(4)].map(() => cloneParticipantRow(null, "pl"));

Sortable.create(participantResister, {
  animation: 150,
  handle: '.handle',
  dragClass: 'dragging',
});

