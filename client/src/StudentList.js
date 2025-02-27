import React, { useState, useEffect } from "react";
import "./StudentList.css";
import Axios from "axios";
import { storage } from "./firebase";
import { listAll, getDownloadURL } from "firebase/storage";
import { ref } from "firebase/storage";
import SearchComponent from "./SearchComponent";

const URL1 = process.env.REACT_APP_SERVER_URL;
const URL = "http://localhost:3031"; // Use your actual server URL here

function StudentList({ studentList, attendanceData, handleAttendanceChange }) {
  const [searchResults, setSearchResults] = useState(studentList || []);
  const [defaultAttendanceData, setDefaultAttendanceData] = useState({});
  const [fileUrls, setFileUrls] = useState({});
  const [loading, setLoading] = useState(true); // New loading state
  const [downloadDate, setDownloadDate] = useState("");
  const imageListRef = ref(storage, "images/");
  const urls = {};

  // Log studentList and attendanceData for debugging
  useEffect(() => {
    console.log("Student List:", studentList);
    console.log("Attendance Data:", attendanceData);
  }, [studentList, attendanceData]);

  useEffect(() => {
    // Update searchResults whenever studentList changes
    setSearchResults(studentList || []);
  }, [studentList]);

  useEffect(() => {
    const defaultData = {};
    studentList.forEach((student) => {
      defaultData[student._id] = "absent";
    });
    setDefaultAttendanceData(defaultData);

    const fetchFileUrls = async () => {
      try {
        const response = await listAll(imageListRef);

        await Promise.all(
          response.items.map(async (item) => {
            try {
              const url = await getDownloadURL(item);
              console.log("Image:", item.name);
              console.log("URL:", url);
              urls[item.name] = url;
            } catch (error) {
              console.error("Error getting download URL:", error);
            }
          })
        );

        // Set file URLs after fetching them
        setFileUrls(urls);
        setLoading(false); // Set loading to false after images are fetched
      } catch (error) {
        console.error("Error listing items:", error);
        setLoading(false); // Set loading to false even on error
      }
    };

    fetchFileUrls();
  }, [studentList]); // Fetch file URLs based on studentList changes

  useEffect(() => {
    // Apply default attendance data when attendanceData prop changes
    setDefaultAttendanceData((prevDefaultData) => ({
      ...prevDefaultData,
      ...attendanceData,
    }));
  }, [attendanceData]);

  const handleUpdateAttendance = () => {
    const defaultAttendanceArray = Object.keys(defaultAttendanceData).map(
      (studentId) => ({
        studentId,
        attendance: "absent",
      })
    );

    const combinedAttendanceArray = [
      ...defaultAttendanceArray,
      ...Object.entries(attendanceData).map(([studentId, attendance]) => ({
        studentId,
        attendance,
      })),
    ];

    const resultMap = new Map();
    for (let i = combinedAttendanceArray.length - 1; i >= 0; i--) {
      const item = combinedAttendanceArray[i];
      if (!resultMap.has(item.studentId)) {
        resultMap.set(item.studentId, item);
      }
    }

    const uniqueLastOccurrenceList = Array.from(resultMap.values());

    Axios.post(`${URL}/attendance`, {
      attendanceData: uniqueLastOccurrenceList,
    })
      .then(() => {
        console.log("Attendance recorded successfully");
      })
      .catch((error) => {
        console.error("Error recording attendance:", error);
      });
  };

  const handleInputChange = (event) => {
    setDownloadDate(event.target.value);
  };

  const handleDownloadToday = () => {
    Axios.get(`${URL}/attendanceToday/${downloadDate}`, {
      responseType: "arraybuffer",
    })
      .then((response) => {
        const blob = new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `attendance.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleSearch = (results) => {
    setSearchResults(results);
  };

  // Show a loading message if data is still being fetched
  if (loading) {
    return <p>Loading student data...</p>;
  }

  // If no students are available, display a message
  if (!studentList || studentList.length === 0) {
    return <p>No students available</p>;
  }

  return (
    <div className="StudentList">
      <SearchComponent
        data={studentList}
        searchKey="Name"
        setSearchResults={handleSearch}
      />

      <table>
        <thead>
          <tr>
            <th style={{ textAlign: "center" }}>Name</th>
            <th style={{ textAlign: "center" }}>Photo</th>
            <th style={{ textAlign: "center" }}>Register Number</th>
            <th style={{ textAlign: "center" }}>Attendance</th>
          </tr>
        </thead>
        <tbody>
          {searchResults.map((student) => (
            <tr key={student._id}>
              <td>{student.Name}</td>
              <td>
                {fileUrls[student.Register_number] ? (
                  <img
                    src={fileUrls[student.Register_number]}
                    alt={`Photo of ${student.Register_number}`}
                    style={{ maxWidth: "100px", maxHeight: "100px" }}
                  />
                ) : (
                  <p>No Image Available</p>
                )}
              </td>
              <td>{student.Register_number}</td>
              <td>
                <div className="attendance-container">
                  <label>
                    <input
                      type="radio"
                      name={`attendance-${student._id}`}
                      value="present"
                      checked={defaultAttendanceData[student._id] === "present"}
                      onChange={() =>
                        handleAttendanceChange(student._id, "present")
                      }
                    />
                    Present
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`attendance-${student._id}`}
                      value="absent"
                      checked={defaultAttendanceData[student._id] === "absent"}
                      onChange={() =>
                        handleAttendanceChange(student._id, "absent")
                      }
                    />
                    Absent
                  </label>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="UpdateButton" onClick={handleUpdateAttendance}>
        Update
      </button>
      <input type="text" value={downloadDate} onChange={handleInputChange} />
      <button className="downloadTodayAttendance" onClick={handleDownloadToday}>
        Download
      </button>
    </div>
  );
}

export default StudentList;
