const hamburgerButton = document.querySelector('#js-buttonHamburger');
const mainArea = document.getElementById('js-main');
const footerArea = document.querySelector('#js-footer');
const navigation = document.querySelector('#js-nav');
const root = document.documentElement;

const imageclipBox = document.querySelector('#js-checkboxImageclip');
const removeNotMain = document.querySelector('#js-checkboxRemove');
const removeTimestamp = document.querySelector('#js-timestampRemove');

const mediaQuery = window.matchMedia('(min-width: 851px)');


const regTabClass = /tab[0-9]/;
const regCharaClass = /chara-[0-9]/;

const sections = document.querySelectorAll(".main-logs section");

const joinMessage = () => {
  for (let sec of sections) {
    const messages = sec.querySelectorAll(".chatlog div.message");
    for( let i in messages ){
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
  }
}



const initialize = () => {
  imageclipBox.checked = false;
  removeNotMain.checked = true;
  removeTimestamp.checked = true;
}

const handleAreaChange = (e) => {
  if (e.matches) {
    navigation.inert = false;
    mainArea.inert = false;
    footerArea.inert = false;
    if (root.classList.contains("is-drawerActive")) {
      root.classList.remove("is-drawerActive");
    }
  } else {
    navigation.inert = !root.classList.contains("is-drawerActive");
  }
}

const scrollprevent = (e) => {
  e.preventDefault();
};

mediaQuery.addEventListener('change', handleAreaChange);

hamburgerButton.addEventListener('click', (e) => {
  const isExpanded = e.currentTarget.getAttribute("aria-expanded") !== "false";
  e.currentTarget.setAttribute("aria-expanded", !isExpanded);
  const isHidden = e.currentTarget.getAttribute("aria-hidden") !== "true";
  e.currentTarget.setAttribute("aria-hidden", !isHidden);


  mainArea.inert = !mainArea.inert;
  footerArea.inert = !footerArea.inert;
  navigation.inert = !navigation.inert;
  root.classList.toggle("is-drawerActive");
})


imageclipBox.addEventListener('change', (e) => {
  document.querySelector('#charactor-list').classList.toggle("is-imageclip");
})

removeNotMain.addEventListener('change', (e) => {
  mainArea.classList.toggle("is-disable");
})

removeTimestamp.addEventListener('change', (e) => {
  mainArea.classList.toggle("is-disable-timestamp");
})

initialize();

handleAreaChange(mediaQuery);

joinMessage();
