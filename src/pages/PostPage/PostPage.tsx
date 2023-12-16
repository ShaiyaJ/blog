import Markdown from "react-markdown";
// import type { UrlTransform } from "react-markdown";

// function transformURL(url: string, key: string, node: any): string {
//     url.replace(".", `https://api.github.com/repos/ShaiyaJ/blog/contents/content/${category}/${project}/${post}/`);
// }

function PostPage({ content }: { content: string }) {
    return <>
        <Markdown
            // urlTransform={transformURL}    
        >
            {content}
        </Markdown>
    </>
}

export default PostPage;