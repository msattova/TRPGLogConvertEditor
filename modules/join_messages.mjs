const regTabClass = /tab[0-9]/;

const joinMessage = (sections) => {
  if (sections.length == 0) {
    const messages = document.querySelectorAll('#js-preview div.message');
    for( let i in messages ){
      console.log(i);
      if (i == 0) {
        continue;
      }
      if (messages[i].children === undefined) {
        continue;
      }
      if (messages[i].classList.contains('diceroll')) {
        continue
      }
      const matchName = messages[i].children[0].textContent === messages[i-1].children[0].textContent;
      const matchTab = regTabClass.exec(messages[i].classList.value)[0] === regTabClass.exec(messages[i-1].classList.value)[0];
      const matchNameColor = messages[i].attributes.style.textContent === messages[i-1].attributes.style.textContent;

      if ( matchName
          && matchTab
          && matchNameColor) {
            messages[i].classList.add('joined');
      }
    }
    return;
  }
  for (let sec of sections) {
    const messages = sec.querySelectorAll(".chatlog div.message");
    for( let i in messages ){
      if (i == 0) {
        console.log(messages[i])
        continue;
      }
      if (messages[i].children === undefined) {
        continue;
      }
      if (messages[i].classList.contains('diceroll')) {
        continue
      }
      const matchName = messages[i].children[0].textContent === messages[i-1].children[0].textContent;
      const matchTab = regTabClass.exec(messages[i].classList.value)[0] === regTabClass.exec(messages[i-1].classList.value)[0];
      const matchNameColor = messages[i].attributes.style.textContent === messages[i-1].attributes.style.textContent;

      if ( matchName
          && matchTab
          && matchNameColor) {
            messages[i].classList.add('joined');
      }
    }
  }
}


export { joinMessage }
