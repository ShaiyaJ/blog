// Components
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import './App.css';
import { QueryClient, QueryClientProvider } from "react-query";

// Pages
import { /*HashRouter as Router, */BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import SearchPage from "./pages/SearchPage/SearchPage";

function App() {
  const queryClient = new QueryClient();
  return (
    <div className="App">
      <Router>
        <Navbar />
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/blog" exact element={<Home />} />
            
            <Route path="/blog/all" exact element={<p>all</p>} />

            <Route
              exact = {true}
              path = "/blog/:category"
              element = {<SearchPage />}
            />

            <Route
              exact = {true}
              path = "/blog/:category/:project"
              element = {<SearchPage />}
            />

            <Route
              exact = {true}
              path = "/blog/:category/:project/:post"
              element = {<SearchPage />}
            />
          </Routes>
        </QueryClientProvider>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
