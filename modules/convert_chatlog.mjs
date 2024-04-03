
const regMessage = /(?<=<div class="([^"]+)" (style[^>]+)>)[\s\S]+(?=<\/div>)/

const regDiv =/<div class="([^"]+)" (style[^>]+)>/;

const regName = /(?<=<b>)([\S\s]*)：(?=<\/b>)/

const regText = /(?<=<\/b>)([\S\s]*)(?=<span>)/;

const regTimestamp = /(?<=<span>)(\[\d{2}:\d{2}\])(?=<\/span>)/

const formatChatlog = (chatlogs) => {
  return chatlogs.map((log) => replaceDiv(log) );
};

const replaceDiv = (line) => {
  if (!regMessage.test(line) ) {
    return line;
  }
  const [tab, style] = line.match(regDiv).slice(1);
  const name = line.match(regName)[1];
  const text = line.match(regText)[1];
  const timestamp = line.match(regTimestamp)[1];
  return `
  <div class="message ${tab}" ${style}>
    <div class="name">${name}</div>
    <div class="text">${text}<span class="timestamp">${timestamp}</span></div>
  </div>`;
};

export {formatChatlog};

