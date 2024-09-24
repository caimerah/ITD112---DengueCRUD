import React, { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

const AddDengueData = () => {
  const [location, setLocation] = useState("");
  const [cases, setCases] = useState("");
  const [deaths, setDeaths] = useState("");
  const [date, setDate] = useState("");
  const [regions, setRegions] = useState("");
  const [dataAdded, setDataAdded] = useState(false); // new state to track data addition

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newDoc = {
        location,
        cases: Number(cases),
        deaths: Number(deaths),
        date,
        regions,
      };
      await addDoc(collection(db, "dengueData"), newDoc);
      setLocation("");
      setCases("");
      setDeaths("");
      setDate("");
      setRegions("");
      setDataAdded(true); // set dataAdded to true
      alert("Data added successfully!");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Cases"
        value={cases}
        onChange={(e) => setCases(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Deaths"
        value={deaths}
        onChange={(e) => setDeaths(e.target.value)}
        required
      />
      <input
        type="date"
        placeholder="Date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Regions"
        value={regions}
        onChange={(e) => setRegions(e.target.value)}
        required
      />
      <button type="submit">Add Data</button>
    </form>
  );
};

export default AddDengueData;