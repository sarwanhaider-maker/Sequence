const BOARD_LAYOUT = [
  ["Free", "6D", "7D", "8D", "9D", "TD", "QD", "KD", "AD", "Free"],
  ["5D", "3H", "2H", "2S", "3S", "4S", "5S", "6S", "7S", "AC"],
  ["4D", "4H", "KD", "AD", "AC", "KC", "QC", "TC", "8S", "KC"],
  ["3D", "5H", "QD", "QH", "TH", "9H", "8H", "9C", "9S", "QC"],
  ["2D", "6H", "TD", "KH", "3H", "2H", "7H", "8C", "TS", "TC"],
  ["AS", "7H", "9D", "AH", "4H", "5H", "6H", "7C", "QS", "9C"],
  ["KS", "8H", "8D", "2C", "3C", "4C", "5C", "6C", "KS", "8C"],
  ["QS", "9H", "7D", "6D", "5D", "4D", "3D", "2D", "AS", "7C"],
  ["TS", "TH", "QH", "KH", "AH", "2C", "3C", "4C", "5C", "6C"],
  ["Free", "9S", "8S", "7S", "6S", "5S", "4S", "3S", "2S", "Free"]
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