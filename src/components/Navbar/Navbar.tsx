import { Link } from "react-router-dom";

function Navbar() {
    return (
        <div className="App">
            <Link to={"/blog"}>Home</Link> -
            [<Link to="/blog/all">All</Link>] 
            [<Link to={"/blog/software"}>Software</Link>]
        </div>
    );
}

export default Navbar;
