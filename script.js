// -----------------------------DEFINE VARIABLES---------------------------------------
// Select element from DOM
let modale = document.querySelector(".modale");
let inputStation = document.querySelector("#input--station");
let inputLine = document.querySelector("#input--line");
let inputWalkingTime = document.querySelector(".input--walkingTime");
let inputBtn = document.querySelector(".section__input .input__btn");
let values = document.querySelector(".section__values");
let valueStation = document.querySelector("#input--station");
let valueLine = document.querySelector(".value--line");
let valueWalkingTime = document.querySelector(".value--walking-time");

let selectDirection = document.querySelector(".select--direction");
let alertSection = document.querySelector(".alert");
let alertSquare = document.querySelector(".alert__square");
let alertText = document.querySelector(".alert__text");
let alertDisplay = document.querySelector(".display");
let alertMessage = document.querySelector(".message");
let alertNextTrain = document.querySelector(".nextTrain");

// Set global variable
let url;
let stationList = {};
let stationId;
let stationName;
let stationLine;

let resultExpected = [];
let selectedOptionValue;
let currentTime;
let expectedTime;

let trains = [];

// Extrapolate hours and minutes of NewData
const date = new Date();
const hours = date.getHours();
const minutes = date.getMinutes();
const seconds = ("0" + date.getSeconds()).slice(-2);
currentTime = `${hours}:${minutes}:${seconds}`;

// -----------------------------FETCH STATION LIST---------------------------------------
async function fetchStationList() {
  try {
    const response = await fetch("/SL.json");
    const data = await response.json();
    const stationList = data.map((station) => ({
      name: station.name,
      id: station.id,
    }));

    // Use stationList here
    getStationUrl(stationList);
  } catch (error) {
    console.error("Error:", error);
  }
}
fetchStationList();

// -----------------------------GET DATA FUNCTION---------------------------------------
function getStationUrl(params) {
  const dataList = document.querySelector("#stations");

  params.forEach((station) => {
    const option = document.createElement("option");
    option.value = station.name;
    dataList.appendChild(option);
  });

  inputStation.addEventListener("input", () => {
    if (inputStation.value) {
      inputLine.removeAttribute("disabled");
      inputWalkingTime.removeAttribute("disabled");
    }
  });

  inputBtn.addEventListener("click", () => {
    stationName = inputStation.value;
    stationLine = inputLine.value;
    walkingTime = inputWalkingTime.value;

    params.find((station) => {
      if (station.name === stationName) {
        stationId = station.id;
      }
    });

    url = `https://transport.integration.sl.se/v1/sites/${stationId}/departures?transport=METRO&line=${stationLine}`;

    // let test = {
    //   url: url,
    //   name: stationName,
    //   line: stationLine,
    //   id: stationId,
    //   walking: walkingTime,
    // };
    // console.log(test);

    // Show the values in html
    if (walkingTime.length === 1) {
      walkingTime = `0${walkingTime}`;
    }
    let showWalkingTime = document.createElement("h2");
    showWalkingTime.innerText = walkingTime;
    valueWalkingTime.appendChild(showWalkingTime);

    let showLine = document.createElement("h2");
    showLine.innerText = stationLine;
    valueLine.appendChild(showLine);

    // Hide modale and show values
    modale.style.display = "none";
    values.style.visibility = "visible";

    getData(url);
  });
}
// -----------------------------GET DATA FUNCTION---------------------------------------
async function getData(url) {
  console.log(url);
  const response = await fetch(url);
  const result = await response.json();
  console.log("result", result);

  // Create option in direction
  let mapDirection = [
    ...new Set(result.departures.map((element) => element.direction)),
  ];
  mapDirection.forEach((direction) => {
    let option = document.createElement("option");
    option.text = direction;
    option.value = direction;
    selectDirection.add(option);
  });

  selectDirection.addEventListener("change", (event) => {
    selectedOptionValue = event.target.value;
    getExpectedTime(selectedOptionValue);
    alertSection.style.visibility = "visible";
  });

  // create a new array with the elements that have the destination
  function getExpectedTime(selectedOptionValue) {
    // Filter trains for directions
    trains = result.departures.filter(
      (element) => element.direction === selectedOptionValue
    );
    console.log("train", trains);

    // Extrapolate hours and minutes of Expected
    let expectedEl;
    let trainsSchedule = trains.map((el) => {
      expectedEl = el.expected;
      for (let i = 0; i < expectedEl.length; i++) {
        if (expectedEl[i] === "T") {
          expectedTime = expectedEl.slice(i + 1, i + 9);
        }
      }

      return expectedTime;
    });
    console.log("trainsSchedule", trainsSchedule);

    // Function to subtract two times
    function subtractTimes(time1, time2) {
      const toSeconds = (time) => {
        const [hours, minutes, seconds] = time.split(":").map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      };

      const secondsToTime = (seconds) => {
        // Calculate hours, minutes and seconds
        const hours = Math.floor(seconds / 3600);
        // Calculate minutes: The remainder of the division of the total seconds by 3600 is divided by 60
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(secs).padStart(2, "0")}`;
      };

      const seconds1 = toSeconds(time1);
      const seconds2 = toSeconds(time2);
      // abs to avoid negative values
      const diffInSeconds = Math.abs(seconds1 - seconds2);

      return secondsToTime(diffInSeconds);
    }

    // Calculate the difference between expected time and newData
    let trainMinutes = subtractTimes(trainsSchedule[0], currentTime);

    let walking = "00:" + walkingTime + ":00";
    console.log("trainMinutes", trainMinutes);
    console.log("walking", walking);
    // ----------------- CODE LOGIC -----------------

    //  Messages to display of the current train
    let textDisplay = document.createElement("h2");
    textDisplay.innerText = `${trainMinutes} min`;
    alertDisplay.appendChild(textDisplay);
    // Messages to display of the next train
    let textNextTrain = document.createElement("h2");
    textNextTrain.innerText = `${subtractTimes(
      trainsSchedule[1],
      currentTime
    )} min`;
    alertNextTrain.appendChild(textNextTrain);

    // different conditions to display the color of the alert
    // Red
    if (trainMinutes < walking) {
      alertSquare.style.backgroundColor = "#ff0000";

      alertMessage.innerText = "Now is not the time!!";
      alertSquare.appendChild(alertMessage);

      // Yellow
    } else if (trainMinutes === walking) {
      alertSquare.style.backgroundColor = "#fff500";

      alertMessage.innerText = "Hurry! You have to go out now!";
      alertSquare.appendChild(alertMessage);

      // Green
    } else if (trainMinutes > "00:" + (walkingTime + 2) + ":00") {
      alertSquare.style.backgroundColor = "#00ff75";
      alertSquare.style.color = "#000E31";

      alertMessage.innerText = "You can leave now";
    }
  }
}
