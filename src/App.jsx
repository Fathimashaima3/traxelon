// // // // src/App.jsx
// // // import React from "react";
// // // import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// // // import { AuthProvider } from "./contexts/AuthContext";
// // // import Navbar from "./components/Navbar";
// // // import ProtectedRoute from "./components/ProtectedRoute";
// // // import Home from "./pages/Home";
// // // import Login from "./pages/Login";
// // // import Signup from "./pages/Signup";
// // // import Dashboard from "./pages/Dashboard";
// // // import About from "./pages/About";
// // // import Contact from "./pages/Contact";
// // // import TrackingCapture from "./pages/TrackingCapture";
// // // import TermsAndConditions from "./pages/TermsAndConditions";
// // // import ResetPassword from "./pages/ResetPassword";

// // // export default function App() {
// // //   return (
// // //     <Router>
// // //       <AuthProvider>
// // //         <Routes>

// // //           {/* Tracking link route - no navbar */}
// // //           <Route path="/t/:token" element={<TrackingCapture />} />



// // //           {/* All normal routes WITH navbar */}
// // //           <Route
// // //             path="*"
// // //             element={
// // //               <div className="min-h-screen bg-surface">
// // //                 <Navbar />
// // //                 <Routes>
// // //                   <Route path="/" element={<Home />} />
// // //                   <Route path="/login" element={<Login />} />
// // //                   <Route path="/signup" element={<Signup />} />
// // //                   <Route path="/about" element={<About />} />
// // //                   <Route path="/contact" element={<Contact />} />
// // //                   <Route path="/terms" element={<TermsAndConditions />} />
// // //                   <Route path="/reset-password" element={<ResetPassword />} />
// // //                   <Route
// // //                     path="/dashboard"
// // //                     element={
// // //                       <ProtectedRoute>
// // //                         <Dashboard />
// // //                       </ProtectedRoute>
// // //                     }
// // //                   />
// // //                 </Routes>
// // //               </div>
// // //             }
// // //           />

// // //         </Routes>
// // //       </AuthProvider>
// // //     </Router>
// // //   );
// // // }



// // import React from "react";
// // import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// // import { AuthProvider } from "./contexts/AuthContext";
// // import Navbar from "./components/Navbar";
// // import ProtectedRoute from "./components/ProtectedRoute";
// // import { useAuth } from "./contexts/AuthContext";
// // import Home from "./pages/Home";
// // import Login from "./pages/Login";
// // import Signup from "./pages/Signup";
// // import Dashboard from "./pages/Dashboard";
// // import About from "./pages/About";
// // import Contact from "./pages/Contact";
// // import TrackingCapture from "./pages/TrackingCapture";
// // import TermsAndConditions from "./pages/TermsAndConditions";
// // import ResetPassword from "./pages/ResetPassword";

// // // ✅ Separate component so it can use useAuth()
// // function AppLayout() {
// //   const { banned } = useAuth();

// //   return (
// //     <div className="min-h-screen bg-surface">
// //       {/* ✅ Hide navbar when banned */}
// //       {!banned && <Navbar />}
// //       <Routes>
// //         <Route path="/" element={<Home />} />
// //         <Route path="/login" element={<Login />} />
// //         <Route path="/signup" element={<Signup />} />
// //         <Route path="/about" element={<About />} />
// //         <Route path="/contact" element={<Contact />} />
// //         <Route path="/terms" element={<TermsAndConditions />} />
// //         <Route path="/reset-password" element={<ResetPassword />} />
// //         <Route
// //           path="/dashboard"
// //           element={
// //             <ProtectedRoute>
// //               <Dashboard />
// //             </ProtectedRoute>
// //           }
// //         />
// //       </Routes>
// //     </div>
// //   );
// // }

// // export default function App() {
// //   return (
// //     <Router>
// //       <AuthProvider>
// //         <Routes>
// //           {/* Tracking link route - no navbar */}
// //           <Route path="/t/:token" element={<TrackingCapture />} />

// //           {/* All normal routes */}
// //           <Route path="*" element={<AppLayout />} />
// //         </Routes>
// //       </AuthProvider>
// //     </Router>
// //   );
// // }




// import React from "react";
// import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
// import { AuthProvider } from "./contexts/AuthContext";
// import Navbar from "./components/Navbar";
// import ProtectedRoute from "./components/ProtectedRoute";
// import { useAuth } from "./contexts/AuthContext";
// import Home from "./pages/Home";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import Dashboard from "./pages/Dashboard";
// import About from "./pages/About";
// import Contact from "./pages/Contact";
// import TrackingCapture from "./pages/TrackingCapture";
// import TermsAndConditions from "./pages/TermsAndConditions";
// import ResetPassword from "./pages/ResetPassword";

// function AppLayout() {
//   const { banned } = useAuth();
//   const location = useLocation();

//   const publicPaths = ["/", "/login", "/signup", "/about", "/contact", "/terms", "/reset-password"];
//   const isPublicPage = publicPaths.includes(location.pathname);

//   return (
//     <div className="min-h-screen bg-surface">
//       {(!banned || isPublicPage) && <Navbar />}
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<Signup />} />
//         <Route path="/about" element={<About />} />
//         <Route path="/contact" element={<Contact />} />
//         <Route path="/terms" element={<TermsAndConditions />} />
//         <Route path="/reset-password" element={<ResetPassword />} />
//         <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//       </Routes>
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <Routes>
//           <Route path="/t/:token" element={<TrackingCapture />} />
//           <Route path="*" element={<AppLayout />} />
//         </Routes>
//       </AuthProvider>
//     </Router>
//   );
// }

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import TrackingCapture from "./pages/TrackingCapture";
import TermsAndConditions from "./pages/TermsAndConditions";
import ResetPassword from "./pages/ResetPassword";
import LinkGenerator from "./pages/Linkgenerator";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/t/:token" element={<TrackingCapture />} />
          <Route path="*" element={
            <div className="min-h-screen bg-surface">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/generate" element={<LinkGenerator />} />
              </Routes>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}