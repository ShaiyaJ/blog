import Markdown from "react-markdown";

function PostPage({ content }: { content: string }) {
    return <>
        <Markdown>{content}</Markdown>
    </>
}

export default PostPage;