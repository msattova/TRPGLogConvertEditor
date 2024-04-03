
const allyData = {
  advLv: 0,
  pcName: "",
  race: "",
  HP: 0,
  MP: 0,
  resistVit: 0,
  resistMnd: 0,
  movePoint: 0,
  guardPoint: 0,
  agi: 0,
  dex: 0,
  mus: 0,
  vit: 0,
  int: 0,
  mnd: 0,
  agiB: 0,
  dexB: 0,
  musB: 0,
  vitB: 0,
  intB: 0,
  mndB: 0,
  skillData: [],
  description: ""
};

const dropZone = document.querySelector('#js-dropzone');

const fileInput = document.querySelector("#js-input");

const skillTemplate = document.querySelector("#js-skill-listitem");

const datasheet = document.querySelector('#js-datasheet .ally');

const downloadButton = document.querySelector("#js-download");

const downloadCSSButton = document.querySelector("#js-download-css");


const regSkill = /([^\d]+)(\d+)/;

const fillDatasheet = (data) => {
  datasheet.querySelector('.adv-lv').textContent = data.advLv;
  datasheet.querySelector('.pc-name').textContent = data.pcName;
  datasheet.querySelector('.race').textContent = data.race;
  datasheet.querySelector('.hp').textContent = data.HP;
  datasheet.querySelector('.mp').textContent = data.MP;
  datasheet.querySelector('.resist-vit').textContent = data.resistVit;
  datasheet.querySelector('.resist-mnd').textContent = data.resistMnd;
  datasheet.querySelector('.move-point').textContent = data.movePoint;
  datasheet.querySelector('.guard-point').textContent = data.guardPoint;

  datasheet.querySelector('.battle-data .agi').textContent = data.agi;
  datasheet.querySelector('.battle-data .dex').textContent = data.dex;
  datasheet.querySelector('.battle-data .vit').textContent = data.vit;
  datasheet.querySelector('.battle-data .mus').textContent = data.mus;
  datasheet.querySelector('.battle-data .int').textContent = data.int;
  datasheet.querySelector('.battle-data .mnd').textContent = data.mnd;

  datasheet.querySelector('.battle-data .agi-b').textContent = data.agiB;
  datasheet.querySelector('.battle-data .dex-b').textContent = data.dexB;
  datasheet.querySelector('.battle-data .vit-b').textContent = data.vitB;
  datasheet.querySelector('.battle-data .mus-b').textContent = data.musB;
  datasheet.querySelector('.battle-data .int-b').textContent = data.intB;
  datasheet.querySelector('.battle-data .mnd-b').textContent = data.mndB;

  datasheet.querySelector('.description .memo').innerHTML = data.description.replaceAll(/\[>\]([^<>]+)/g, '<details><summary>$1</summary>')
                                                                      .replaceAll(/\[-{3,}\]/g, '</details>')
                                                                      .replaceAll(/<br>\*\s*([^<>]+)<br>/g, '<h3>$1</h3>')
                                                                      .replaceAll(/(\s?-\s?){3,}/g, '<hr style="border-style: dashed;border-width: 1px 0 0;">')
                                                                      .replaceAll(/<br><h3/g, '<h3')
                                                                      .replaceAll(/<\/h3><br>/g, '</h3>');


  const skillData = datasheet.querySelector('.skill-data');
  const skills = data.skillData;
  for (let el of skills) {
    const [skill_name, skill_lv] = regSkill.exec(el).slice(1);
    const node = skillTemplate.content.cloneNode(true);
    node.querySelector('.term').textContent = skill_name;
    node.querySelector('.lv').textContent = skill_lv;
    skillData.appendChild(node);
  }

};

const getFileData = (file) => {
  return new Promise((resolve) => {
    let fr = new FileReader();
    fr.onload = (e) => {
      resolve(e.currentTarget.result);
    };
    fr.readAsText(file);
  });
}

const readJSON = async (file) => {
  console.log(file);
  const data = await getFileData(file);
  const json = JSON.parse(data);
  console.log(json);
  const object_data = Object.create(allyData);
  object_data.agi = json.sttAgi;
  object_data.dex = json.sttDex;
  object_data.int = json.sttInt;
  object_data.mnd = json.sttMnd;
  object_data.mus = json.sttStr;
  object_data.vit = json.sttVit;
  object_data.agiB = json.bonusAgi;
  object_data.dexB = json.bonusDex;
  object_data.intB = json.bonusInt;
  object_data.mndB = json.bonusMnd;
  object_data.musB = json.bonusStr;
  object_data.vitB = json.bonusVit;
  object_data.resistMnd = json.mndResistTotal;
  object_data.resistVit = json.vitResistTotal;
  object_data.HP = json.hpTotal;
  object_data.MP = json.mpTotal;
  object_data.movePoint = json.mobilityTotal;
  object_data.guardPoint = json.defenseTotalAllDef;
  object_data.pcName = json.characterName;
  object_data.race = json.race;
  object_data.advLv = json.level;
  object_data.skillData = json.sheetDescriptionS.replace(/.+\n技能:(.+)/, "$1").split('／');
  object_data.description = json.freeNote.replaceAll('&lt;', '<').replaceAll('&gt;', '>');

  return object_data;
};

/* ファイル読み込み時の処理 */
fileInput.addEventListener('change', async (e) => {
  const file = e.currentTarget.files[0];
  if (!file) return;
  const data = await readJSON(file);
  console.log(data);
  fillDatasheet(data);
});


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
    const data = await readJSON(file);
    console.log(data);
    fillDatasheet(data);
  } else {
    // pass
  }
});

const downloadHTML = (filename, data) => {
  const blob = new Blob([data]);
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();

  URL.revokeObjectURL(link.href);
};


downloadButton.addEventListener('click', async (e) => {
  const data = datasheet.innerHTML;
  downloadHTML(`datasheet.html`, data);
}, false);

downloadCSSButton.addEventListener('click', async (e) => {
  const data = await fetch('../css/data_style.css').then(r=>r.text());;
  downloadHTML(`datasheet.css`, data);
}, false);
