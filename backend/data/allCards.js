const BOARD_LAYOUT = [
  ["Free", "6D", "7D", "8D", "9D", "TD", "QD", "KD", "AD", "Free"],
  ["5D", "3H", "2H", "2S", "3S", "4S", "5S", "6S", "7S", "AC"],
  ["6C", "AS", "2D", "3D", "4D", "5D", "6D", "7D", "8H", "QS"],
  ["7C", "KS", "6C", "5C", "4C", "3C", "2C", "8D", "7H", "KS"],
  ["8C", "QS", "7C", "AS", "2D", "3D", "4D", "9D", "6H", "AS"],
  ["TC", "TS", "8C", "KS", "6C", "5C", "4C", "TD", "5H", "2D"],
  ["TC", "9S", "9C", "QS", "7C", "AS", "2D", "QD", "4H", "3D"],
  ["QC", "8S", "TC", "TS", "8C", "KS", "AS", "KD", "3H", "4D"],
  ["KC", "7S", "QC", "9S", "9C", "8C", "7C", "AD", "2H", "5D"],
  ["Free", "6S", "5S", "4S", "3S", "2S", "2H", "3H", "5D", "Free"]
];

let boardCards = [];
for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
        let code = BOARD_LAYOUT[r][c];
        let id = r * 10 + c + 1;
        let img = "";
        if (code === "Free") {
            img = "../assests/1B.svg";
        } else {
            img = `../assests/${code}.svg`;
        }
        boardCards.push({
            id: id,
            img: img,
            selected: false,
            selectedby: "",
            code: code,
            matches: []
        });
    }
}

// Compute matches for all board cards
boardCards.forEach(card => {
    if (card.code !== "Free") {
        let matches = [];
        boardCards.forEach(other => {
            if (other.code === card.code) {
                matches.push(other.id);
            }
        });
        card.matches = matches;
    }
});

// Jack cards
let jackCards = [
    { id: 101, img: "../assests/JD.png", selected: false, selectedby: "", code: "JD", matches: [] },
    { id: 102, img: "../assests/JD.png", selected: false, selectedby: "", code: "JD", matches: [] },
    { id: 103, img: "../assests/JC.png", selected: false, selectedby: "", code: "JC", matches: [] },
    { id: 104, img: "../assests/JC.png", selected: false, selectedby: "", code: "JC", matches: [] },
    { id: 105, img: "../assests/JS.png", selected: false, selectedby: "", code: "JS", matches: [] },
    { id: 106, img: "../assests/JS.png", selected: false, selectedby: "", code: "JS", matches: [] },
    { id: 107, img: "../assests/JH.png", selected: false, selectedby: "", code: "JH", matches: [] },
    { id: 108, img: "../assests/JH.png", selected: false, selectedby: "", code: "JH", matches: [] }
];

const allCards = [...boardCards, ...jackCards];

module.exports = allCards;