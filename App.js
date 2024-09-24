import React from "react";
import AddDengueData from "./AddDengueData";
import DengueDataList from "./DengueDataList";
import "./App.css";

function App() {
  return (
    <div>
      <div className="app-container">
        <header>
          <h1>Dengue Data CRUD App</h1>
        </header>
        <main>
          <section className="add-data-section">
            <h2>Add New Dengue Data</h2>
            <AddDengueData />
          </section>
          <section className="data-list-section">
            <h2>Dengue Data List</h2>
            <DengueDataList />
          </section>
        </main>
      </div>
      <footer style={{
  fontSize: '12px',
  fontFamily: 'Arial',
  lineHeight: '1',
  padding: '10px',
  backgroundColor: '#f0f0f0',
  borderTop: '1px solid #ccc',
  textAlign: 'center',
  fontWeight: 'bold'
}}>
  <p style={{ marginBottom: '5px' }}>LABORATORY EXERCISES #1</p>
  <p style={{ marginBottom: '5px' }}>ITD112 - IT4D</p>
  <p>Abdul, Caimerah</p>
</footer>
    </div>
  );
}

export default App;