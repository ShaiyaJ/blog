import { useParams, Link } from "react-router-dom";
import { useQuery } from "react-query";

import PostPage from "../PostPage/PostPage";

function b64DecodeUnicode(str) {        // https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
}

async function getBlogData( 
    category: string,
    project?: string, 
    post?: string
): Promise<string[] | string> {
    // Handling possibility for project and post to be undefined 
    // Transformed to empty string in order to avoid pointing the req to "/undefined/undefined" at the end
    if (!project) {
        project = "";
    }

    if (!post) {
        post = "";
    }

    // Request
    const req = await fetch(
        `https://api.github.com/repos/ShaiyaJ/blog/contents/content/${category}/${project}/${post}`,
        {
            method: "GET",
            headers: {
                "User-Agent": "fetch",
            },
        }
    )
    //   .catch((e) => {
    //     console.error(e.text());
    //   });

    if (!req.ok) {
        throw new Error(
            `Network response was not ok ${req.status}, ${req.statusText}`
        );
    }

    // Handling differences between returning post contents and returning lists of projects/categories
    const jsonData = await req.json(); 

    if (post) {                       // Post has content returned
        if (!jsonData.content) {
            return "Post doesn't exist";
        } 

        return jsonData.content;
    }

    return jsonData
        .map((element) => element.name)
        .filter((e) => !e.endsWith(".png"));
}



function SearchPage() {
    const params = useParams();
    const { category, project, post } = params; // Can use destructuring here
  
    console.log(category, project, post);

    // Fetching items based on what is being queried
    const { isLoading, isError, data, error } = useQuery({
        queryKey: [`blog-location-${category}-${project}-${post}`],
        queryFn: () => getBlogData(category, project, post),
    });
  
    if (isLoading) {
        return <p>Loading...</p>;
    }
  
    if (isError) {
        // return <p>Error - {error.message}</p>
        return <p>Error</p>;
    }
  
    console.log("Data:", data);

    // Returning page
    if (typeof data === "string") {
        const decodedData = b64DecodeUnicode(data);
        return <PostPage content={decodedData} />;
    } 
  
    return (
        <>
            {data.map((element, idx) => {
                return (
                    <>
                        <Link key={idx} to={`./${element}`}>{`${element}`}</Link> <br /><br />
                    </>
                );
            })}
        </>
    );
}
  
export default SearchPage;