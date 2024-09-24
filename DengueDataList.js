import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Bar, Scatter } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const DengueDataList = () => {
  // State variables
  const [dengueData, setDengueData] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ location: "", cases: "", deaths: "", date: "", regions: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [showBarChart, setShowBarChart] = useState(false);
  const [showScatterChart, setShowScatterChart] = useState(false);
  const [aggregationBasis, setAggregationBasis] = useState("monthly");

  // New State Variables for Year Selection
  const [selectedYearBarChart, setSelectedYearBarChart] = useState("");
  const [selectedYearScatterChart, setSelectedYearScatterChart] = useState("");

  // Real-time data fetching with onSnapshot
  useEffect(() => {
    const dengueCollection = collection(db, "dengueData");

    const unsubscribe = onSnapshot(
      dengueCollection,
      (snapshot) => {
        const dataList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDengueData(dataList);
      },
      (error) => {
        console.error("Error fetching real-time data: ", error);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Handle Delete Operation
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "dengueData", id));
      alert("Data deleted successfully!");
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("Failed to delete data.");
    }
  };

  // Handle Edit Operation
  const handleEdit = (data) => {
    setEditingId(data.id);
    setEditForm({
      location: data.location,
      cases: data.cases,
      deaths: data.deaths,
      date: data.date,
      regions: data.regions,
    });
  };

  // Handle Update Operation
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "dengueData", editingId), { ...editForm, cases: +editForm.cases, deaths: +editForm.deaths });
      setEditingId(null);
      alert("Data updated successfully!");
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Failed to update data.");
    }
  };

  // Handle Page Change for Pagination
  const handlePageChange = (page) => setCurrentPage(page);

  // Pagination Logic
  const paginatedData = useMemo(() => (
    dengueData
      .filter(data => data.location.toLowerCase().includes(searchTerm.toLowerCase()) || data.regions.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.location.localeCompare(b.location))
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  ), [dengueData, searchTerm, currentPage, itemsPerPage]);

  // Extract Unique Years from Data
  const uniqueYears = useMemo(() => {
    const yearsSet = new Set(dengueData.map(data => new Date(data.date).getFullYear()));
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [dengueData]);

  // Add a state variable to store the selected aggregation basis
  const [barAggregationBasis, setBarAggregationBasis] = useState("monthly");

  // Create a function to aggregate the data for the bar chart based on the selected basis
  const aggregateBarData = useMemo(() => {
    let filteredData = dengueData;

    if (barAggregationBasis === "monthly" && selectedYearBarChart) {
      // Filter data by selected year
      filteredData = dengueData.filter(data => new Date(data.date).getFullYear() === Number(selectedYearBarChart));
    }

    if (barAggregationBasis === "monthly") {
      // Aggregate data by month
      const monthlyData = filteredData.reduce((acc, data) => {
        const date = new Date(data.date);
        const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
        if (!acc[monthYear]) {
          acc[monthYear] = { cases: 0, deaths: 0 };
        }
        acc[monthYear].cases += data.cases;
        acc[monthYear].deaths += data.deaths;
        return acc;
      }, {});

      const sortedMonthlyData = Object.entries(monthlyData).sort((a, b) => {
        const dateA = new Date(`${a[0]} 1`);
        const dateB = new Date(`${b[0]} 1`);
        return dateA - dateB;
      });

      return {
        labels: sortedMonthlyData.map(([date]) => date),
        datasets: [
          {
            label: "Cases",
            data: sortedMonthlyData.map(([, { cases }]) => cases),
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            hoverBackgroundColor: "rgba(75, 192, 192, 0.8)",
            hoverBorderColor: "rgba(75, 192, 192, 1)",
          },
          {
            label: "Deaths",
            data: sortedMonthlyData.map(([, { deaths }]) => deaths),
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
            hoverBackgroundColor: "rgba(255, 99, 132, 0.8)",
            hoverBorderColor: "rgba(255, 99, 132, 1)",
          },
        ],
      };
    } else {
      // Aggregate data by year
      const yearlyData = filteredData.reduce((acc, data) => {
        const year = new Date(data.date).getFullYear();
        if (!acc[year]) {
          acc[year] = { cases: 0, deaths: 0 };
        }
        acc[year].cases += data.cases;
        acc[year].deaths += data.deaths;
        return acc;
      }, {});

      const sortedYearlyData = Object.entries(yearlyData).sort((a, b) => a[0] - b[0]);

      return {
        labels: sortedYearlyData.map(([year]) => year),
        datasets: [
          {
            label: "Cases",
            data: sortedYearlyData.map(([, { cases }]) => cases),
            backgroundColor: "rgba(75, 192, 192, 0.6)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
            hoverBackgroundColor: "rgba(75, 192, 192, 0.8)",
            hoverBorderColor: "rgba(75, 192, 192, 1)",
          },
          {
            label: "Deaths",
            data: sortedYearlyData.map(([, { deaths }]) => deaths),
            backgroundColor: "rgba(255, 99, 132, 0.6)",
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
            hoverBackgroundColor: "rgba(255, 99, 132, 0.8)",
            hoverBorderColor: "rgba(255, 99, 132, 1)",
          },
        ],
      };
    }
  }, [dengueData, barAggregationBasis, selectedYearBarChart]);

  // Function to Calculate Linear Regression for Trendline
  const calculateTrendline = (dataPoints) => {
    const n = dataPoints.length;
    if (n === 0) return [];

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    dataPoints.forEach(({ x, y }) => {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const denominator = n * sumX2 - sumX * sumX;
    if (denominator === 0) return [];

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const xs = dataPoints.map((point) => point.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);

    return [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept },
    ];
  };

  // Aggregate Data for the Scatter Plot Based on Aggregation Basis
  const scatterDataPoints = useMemo(() => {
    let filteredData = dengueData;

    if (aggregationBasis === "monthly" && selectedYearScatterChart) {
      // Filter data by selected year
      filteredData = dengueData.filter(data => new Date(data.date).getFullYear() === Number(selectedYearScatterChart));
    }

    const aggregate = filteredData.reduce((acc, data) => {
      const date = new Date(data.date);
      const key =
        aggregationBasis === "monthly"
          ? `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`
          : `${date.getFullYear()}`;

      if (!acc[key]) {
        acc[key] = { cases: 0, deaths: 0 };
      }
      acc[key].cases += data.cases;
      acc[key].deaths += data.deaths;
      return acc;
    }, {});

    return Object.entries(aggregate).map(
      ([label, { cases, deaths }]) => ({
        x: cases,
        y: deaths,
        label,
      })
    );
  }, [dengueData, aggregationBasis, selectedYearScatterChart]);

  // Calculate Trendline Points
  const trendlinePoints = useMemo(
    () => calculateTrendline(scatterDataPoints),
    [scatterDataPoints]
  );

  // Scatter Chart Data with Trendline
  const scatterChartData = {
    datasets: [
      {
        label: "Cases vs Deaths",
        data: scatterDataPoints,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        pointRadius: 5,
        showLine: false,
        type: "scatter",
      },
      {
        label: "Trendline",
        data: trendlinePoints,
        type: "line",
        fill: false,
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  // Scatter Chart Options
  const scatterChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text:
          aggregationBasis === "monthly"
            ? "Relationship Between Cases and Deaths (Monthly)"
            : "Relationship Between Cases and Deaths (Yearly)",
      },
      tooltip: {
        callbacks: {
          label: ({ raw }) =>
            `${raw.label}: Cases: ${raw.x}, Deaths: ${raw.y}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Number of Cases" },
        beginAtZero: true,
      },
      y: {
        title: { display: true, text: "Number of Deaths" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      {/* Edit Form */}
      {editingId ? (
        <form
          onSubmit={handleUpdate}
          style={{
            margin: "20px auto",
            padding: "20px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            maxWidth: "500px",
          }}
        >
          <h3>Edit Dengue Data</h3>
          {["location", "cases", "deaths", "date", "regions"].map(
            (field) => (
              <input
                key={field}
                type={
                  field === "date" || field === "cases" || field === "deaths"
                    ? field === "date"
                      ? "date"
                      : "number"
                    : "text"
                }
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={editForm[field]}
                onChange={(e) =>
                  setEditForm({ ...editForm, [field]: e.target.value })
                }
                required
                style={{
                  display: "block",
                  width: "100%",
                  marginBottom: "10px",
                }}
              />
            )
          )}
          <div>
            <button type="submit" style={{ marginRight: "10px" }}>
              Update Data
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              style={{
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                padding: "5px 10px",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div>

          {/* Dengue Data Table */}
          <table
            style={{
              width: "90%",
              borderCollapse: "collapse",
              margin: "auto",
              marginBottom: "20px",
              border: "1px solid #ddd",
            }}
          >
            <thead>
              <tr>
                {["#", "Location", "Cases", "Deaths", "Date", "Regions", "Actions"].map(
                  (header, idx) => (
                    <th
                      key={idx}
                      style={{
                        textAlign: "center",
                        padding: "8px",
                        fontWeight: "bold",
                        borderBottom: "1px solid #ddd",
                      }}
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((data, index) => (
                <tr key={data.id} style={{ lineHeight: "1" }}>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    {data.location}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    {data.cases}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    {data.deaths}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    {new Date(data.date).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    {data.regions}
                  </td>
                  <td style={{ textAlign: "center", padding: "8px" }}>
                    <button
                      onClick={() => handleEdit(data)}
                      style={{
                        marginRight: "5px",
                        backgroundColor: "#32CD32",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(data.id)}
                      style={{
                        backgroundColor: "#f01e2c",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            {Array.from({
              length: Math.ceil(dengueData.length / itemsPerPage),
            }).map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={index + 1 === currentPage ? "active" : ""}
                style={{
                  margin: "0 5px",
                  padding: "5px 10px",
                  backgroundColor:
                    index + 1 === currentPage ? "#4CAF50" : "#f1f1f1",
                  color: index + 1 === currentPage ? "white" : "black",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Container for Bar Chart */}
      <div
        className="chart-container"
        style={{
          marginTop: "30px",
          width: "90%",
          margin: "auto",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
          marginBottom: "40px",
        }}
      >
        <h2>Total Cases vs Total Deaths Over Time</h2>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => setShowBarChart(true)}
            style={{
              backgroundColor: "#f7f7f7",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              color: "#333",
            }}
          >
            <i className="fas fa-chart-bar" style={{ marginRight: "10px" }} />
            Visualize
          </button>
          {showBarChart && (
            <span
              style={{
                marginLeft: "10px",
                cursor: "pointer",
              }}
              onClick={() => setShowBarChart(false)}
            >
              ×
            </span>
          )}
        </div>
        {showBarChart && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "20px",
                flexWrap: "wrap", // Ensure responsiveness
              }}
            >
              {["monthly", "yearly"].map((basis) => (
                <label key={basis} style={{ marginRight: "10px", marginBottom: "10px" }}>
                  <input
                    type="radio"
                    name="barAggregationBasis"
                    value={basis}
                    checked={barAggregationBasis === basis}
                    onChange={() => {
                      setBarAggregationBasis(basis);
                      // Reset selected year when changing aggregation basis
                      if (basis !== "monthly") {
                        setSelectedYearBarChart("");
                      }
                    }}
                    style={{ marginRight: "5px" }}
                  />
                  {basis.charAt(0).toUpperCase() + basis.slice(1)}
                </label>
              ))}
            </div>

            {/* Year Selection Dropdown for Bar Chart */}
            {barAggregationBasis === "monthly" && uniqueYears.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <label htmlFor="barYearSelect" style={{ marginRight: "10px" }}>
                  Select Year:
                </label>
                <select
                  id="barYearSelect"
                  value={selectedYearBarChart}
                  onChange={(e) => setSelectedYearBarChart(e.target.value)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="">-- Select Year --</option>
                  {uniqueYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Bar
              data={aggregateBarData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: {
                    display: true,
                    text:
                      barAggregationBasis === "monthly"
                        ? selectedYearBarChart
                          ? `Total Cases and Deaths for ${selectedYearBarChart}`
                          : "Total Cases and Deaths (Monthly)"
                        : "Total Cases and Deaths (Yearly)",
                  },
                },
                scales: {
                  x: {
                    title: { display: true, text: "Date" },
                  },
                  y: {
                    title: { display: true, text: "Count" },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        )}
      </div>

      {/* Container for Scatter Plot with Filter */}
      <div
        className="scatter-chart-container"
        style={{
          width: "90%",
          margin: "auto",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2>Relationship Between Cases and Deaths</h2>

        {/* Button to show/hide scatter plot */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => setShowScatterChart(true)}
            style={{
              backgroundColor: "#f7f7f7",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              color: "#333",
            }}
          >
            <i className="fas fa-chart-scatter" style={{ marginRight: "10px" }} />
            Visualize
          </button>
          {showScatterChart && (
            <span
              style={{
                marginLeft: "10px",
                cursor: "pointer",
              }}
              onClick={() => setShowScatterChart(false)}
            >
              ×
            </span>
          )}
        </div>

        {/* Scatter Plot */}
        {showScatterChart && (
          <div>
            {/* Filter Toggle */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "20px",
                flexWrap: "wrap", // Ensure responsiveness
              }}
            >
              {["monthly", "yearly"].map((basis) => (
                <label key={basis} style={{ marginRight: "10px", marginBottom: "10px" }}>
                  <input
                    type="radio"
                    name="aggregationBasis"
                    value={basis}
                    checked={aggregationBasis === basis}
                    onChange={() => {
                      setAggregationBasis(basis);
                      // Reset selected year when changing aggregation basis
                      if (basis !== "monthly") {
                        setSelectedYearScatterChart("");
                      }
                    }}
                    style={{ marginRight: "5px" }}
                  />
                  {basis.charAt(0).toUpperCase() + basis.slice(1)}
                </label>
              ))}
            </div>

            {/* Year Selection Dropdown for Scatter Chart */}
            {aggregationBasis === "monthly" && uniqueYears.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <label htmlFor="scatterYearSelect" style={{ marginRight: "10px" }}>
                  Select Year:
                </label>
                <select
                  id="scatterYearSelect"
                  value={selectedYearScatterChart}
                  onChange={(e) => setSelectedYearScatterChart(e.target.value)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="">-- Select Year --</option>
                  {uniqueYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Scatter
              data={scatterChartData}
              options={scatterChartOptions}
              key={`scatter-${aggregationBasis}-${selectedYearScatterChart}`} // Unique key to force re-render
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DengueDataList;
