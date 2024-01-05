import { useState, useEffect } from "react";
// import XMLData from './data/banksparing.xml';
import XMLData2 from './data/banksparing-edited.xml';
import xml2js from "xml2js";
import axios from 'axios'

import './App.css';

function App() {
  const [xmlJson, setXmlJson] = useState(null);
  const [messages, setMessages] = useState([{ text: 'Hei! Hvor gammel er du?', type: 'bot' }]);
  const [userInput, setUserInput] = useState(0);

  const [chatStep, setChatStep] = useState("AGE");

  const [age, setAge] = useState(null);
  const [student, setStudent] = useState(null);
  const [pension, setPension] = useState(null);
  const [interest, setInterest] = useState(0);

  const [banks, setBanks] = useState([]);
  const parser = new xml2js.Parser();
  let bankOVerview = []

  // Lag en intro funksjon som forklarer og legger til messages til messages

  const handleUserInput = (e) => {
    setInterest(e.target.value)
    setUserInput(e.target.value);
  };

  //Init funksjon for å lese XML fil og omgjøre den til object JSON
  const initApplication = () => {
    axios.get(XMLData2, {
      "Content-Type": "application/xml; charset=utf-8"
    }).then((response) => {
      // Loop created without checking if xmlJson exist
      if (!xmlJson) {
        parser.parseString(response.data, function (err, result) {
          setXmlJson(result);
        });
      }
    });



    if (xmlJson) {

      for (let i = 0; i < xmlJson.feed.entry.length; i++) {
        let singleEntry = xmlJson.feed.entry[i];
        let entry = {};
        // console.log("xmlJson.feed.entry", singleEntry.title[0])
        // console.log("singleEntry", singleEntry.gruppe[0])
        let keys = Object.keys(singleEntry);

        for (let v = 0; v < keys.length; v++) {
          entry[keys[v]] = singleEntry[keys[v]][0];
          // console.log(singleEntry[keys[v]]);
        }

        bankOVerview.push(entry);
      }
    }


    // if (!banks) {
    //   setBanks(bankOVerview);
    // }
  }

  //Felles funksjon for å legge nye meldinger i stage
  const addMessagesToState = (input, who) => {
    // Shared function to put messages in state
    setMessages(oldArray => [...oldArray, { text: input, type: who }]);
  }

  //Funksjon som tar for seg alt av input (Et totalt kaos uten AI ._.)
  const handleSendMessage = (step, input_type, input) => {
    // Logic:
    // 1 - Check step
    // 3 - Check what input was given to give correct answer
    // 4 - Send a message to function to limit the data used

    // console.log("step", step)
    // console.log("input_type", input_type)
    // console.log("input", input)



    // STEP : AGE
    if (step === "AGE") {
      let readable_age;
      if (input === "UNDER_18") {
        setAge(18);
        readable_age = "under 18 år"
        addMessagesToState("Jeg er 18 år eller yngre", "user")
      }
      if (input === "18-33") {
        setAge(20);
        readable_age = "mellom 18-34 år"
        addMessagesToState("Jeg er mellom 18 til 34 år gammel", "user")
      }

      if (input === "ABOVE_34") {
        setAge(34);
        readable_age = "34 år eller eldre"
        addMessagesToState("Jeg er 34 år eller eldre", "user")
      }

      addMessagesToState("Så du er " + readable_age + "!", "Bot")

      if (input != "UNDER_18") {
        addMessagesToState("Er du student?", "Bot")
        setChatStep("STUDENT")
      } else {
        addMessagesToState("Ønsker du å spare til pensjon?", "Bot")
        setChatStep("PENSION")
      }

      if (!input) {
        setChatStep("AGE")
        addMessagesToState("Noe gikk galt gitt, vennligst prøv igjen", "bot")
      }

    }

    // STEP : STUDENT
    if (step === "STUDENT") {
      if (input) {
        addMessagesToState("Jeg er student", "user")
        addMessagesToState("Du er student", "bot")
      }
      if (!input) {
        addMessagesToState("Jeg er ikke student", "user")
        addMessagesToState("Du er ikke student", "bot")
      }
      setStudent(input);
      setChatStep("PENSION")

      if (input === null) {
        setChatStep("STUDENT")
        addMessagesToState("Noe gikk galt gitt, vennligst prøv igjen", "bot")
      }
    }

    // STEP : PENSION
    if (step === "PENSION") {
      if (input) {
        addMessagesToState("Jeg ønsker å spare til pensjon", "user")
        addMessagesToState("Du ønsker å spare i pensjon", "bot")
      }
      if (!input) {
        addMessagesToState("Jeg ønsker ikke å spare til pensjon", "user")
        addMessagesToState("Du ønsker ikke  å spare i pensjon", "bot")
      }


      if (input === null) {
        setChatStep("PENSION")
        addMessagesToState("Noe gikk galt gitt, vennligst prøv igjen", "bot")
      }
      setPension(input);
      setChatStep("INTEREST")

      addMessagesToState("Hvilken rente har du idag? (Hvis du ikke har noen sparekonto eller rente idag, skriv 0)", "bot")

    }

    // STEP : INTEREST
    if (step === "INTEREST") {

      if (input != 0) {
        setInterest(input);
        addMessagesToState("Så du har " + input + "% i rente idag?", "bot")
      }

      if (input == 0) {
        setInterest(false);
        addMessagesToState("Så du har ingen rente eller sparing idag", "bot")
      }


      // Fjern input
      console.log("userInput", input);
      console.log("input", input);

      // setUserInput('');
      setChatStep("FINAL")
      finalizeList()

    }


    // Chatbot flow:
    // 1 - Alder (Limitere hvilke tilbud som kommer opp)
    // 2 - Student? Pensjonsparing?
    // 4 - Rente? (Få muligheten til å spesifisere ønsket rente / rente idag)

    // console.log("messages", messages)
  };

  const finalizeList = () => {
    addMessagesToState("Takk for din informasjon. Jeg skal ta å gå gjennom et par lister her for deg", "bot")

    let condensedResult = []


    //condense list based on age

    const condenseAge = () => {

      let age_group;
      let age_array = [];

      if (age === 18) {
        age_group = 18;
      } else if (age > 33) {
        age_group = 34;
      } else {
        for (var a = 18; a < 34; a++) {
          age_array.push(a)
        }

      }
      for (let i = 0; i < bankOVerview.length; i++) {
        let item = bankOVerview[i];

        if (age_group) {
          if (item.min_alder.includes(age_group)) {
            // console.log("item.min_alder", item.min_alder);
            condensedResult.push(item);
          }
        } else {
          for (let v = 0; v < age_array.length; v++) {
            if (item.min_alder.includes(age_array[v])) {
              // console.log("item.min_alder", item.min_alder);
              condensedResult.push(item);
            }
          }
        }
      }
      //condense list based on student or not
      console.log("condensedResult after age", condensedResult.length)
      condenseStudent();
    }

    const condenseStudent = () => {

      console.log("student", student)

      for (let i = 0; i < condensedResult.length; i++) {
        let item = bankOVerview[i];
        // console.log("student from state", student)
        // console.log("item.student", Boolean(item.student))

        // console.log("item in student", item.student === student);

        if (Boolean(item.student) === Boolean(student)) {
          console.log("item", item);
        }

        // if (item.student != student) {
        //   console.log("item", item);
        //   bankOVerview.splice(i, 1)
        // }

      }
    }
    const condensePension = () => { }
    const condensInterest = () => { }

    condenseAge();
  }


  // Fremgang
  // 1 - Les XML fil og gjør om til JSON
  // 2 - Gjøre om JSON fil til format som er enkelt å jobbe med 
  // 3 - Lage en chatbot?


  initApplication();

  // console.log("bankOVerview", bankOVerview);

  return (
    <div className="">
      <div>
        <div style={{ height: '100%', border: '1px solid #ccc', overflowY: 'scroll' }}>
          {messages.map((message, index) => (
            <div key={index} style={{ padding: '8px', textAlign: message.type === 'user' ? 'right' : 'left' }}>
              <span style={{ background: message.type === 'user' ? '#d3e0dc' : '#f0f0f0', padding: '8px', borderRadius: '8px' }}>
                {message.text}
              </span>
            </div>
          ))}
          {chatStep === "AGE" ? <div style={{ padding: '8px', textAlign: "right" }} >
            <button onClick={() => handleSendMessage("AGE", "button", "UNDER_18")}>Under 18</button>
            <button onClick={() => handleSendMessage("AGE", "button", "18-33")}>18 - 33</button>
            <button onClick={() => handleSendMessage("AGE", "button", "ABOVE_34")}>Over 34</button>
          </div> : null}
          {chatStep === "STUDENT" ? <div style={{ padding: '8px', textAlign: "right" }} >
            <button onClick={() => handleSendMessage("STUDENT", "button", true)}>Jeg er student</button>
            <button onClick={() => handleSendMessage("STUDENT", "button", false)}>Jeg er ikke student</button>
          </div> : null}
          {chatStep === "PENSION" ? <div style={{ padding: '8px', textAlign: "right" }} >
            <button onClick={() => handleSendMessage("PENSION", "button", true)}>Jeg ønsker å spare til pensjon</button>
            <button onClick={() => handleSendMessage("PENSION", "button", false)}>Jeg ønsker ikke å spare til pensjon</button>
          </div> : null}
          {chatStep === "INTEREST" ? <div style={{ padding: '8px', textAlign: "right" }} >
            <div style={{ marginTop: '8px' }}>
              <input type="text" value={userInput} onChange={handleUserInput} />
              <button onClick={() => handleSendMessage("INTEREST", "input", "0")}>Send</button>
            </div>
          </div> : null}
          {chatStep === "FINAL" ? <div style={{ padding: '8px', textAlign: "right" }} >
            <div style={{ marginTop: '8px' }}>
              <div>Heheheh</div>
            </div>
          </div> : null}

        </div>
      </div>
    </div >
  );
}

export default App;
