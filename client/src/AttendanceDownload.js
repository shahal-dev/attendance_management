import React, { useState } from "react";
import "./App.css";
import Axios from "axios";
import "./StudentForm.css";

const URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3031";

function AttendanceDownload() {
  const [result, setResult] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleDownloadAttendance = async (e) => {
    e.preventDefault();

    // Basic validation for dates
    if (!startDate || !endDate) {
      setResult("Please enter both start and end dates.");
      return;
    }

    try {
      const response = await Axios.get(
        `${URL}/data/download?start=${startDate}&end=${endDate}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "attendance.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      setResult("Downloaded successfully");
    } catch (error) {
      console.error("Error downloading attendance data:", error);
      if (error.response && error.response.status === 404) {
        setResult("Attendance data not found for the specified dates.");
      } else {
        setResult("Failed to download attendance data. Please try again.");
      }
    }
  };

  return (
    <div>
      <h1>Download Attendance</h1>
      <form onSubmit={handleDownloadAttendance}>
        <label>Start Date:</label>
        <input
          type="date" // Change to date input for better UX
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>End Date:</label>
        <input
          type="date" // Change to date input for better UX
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button className="DownloadButton" type="submit">
          Download Attendance
        </button>
        {result && <p>{result}</p>}
      </form>
    </div>
  );
}

export default AttendanceDownload;
