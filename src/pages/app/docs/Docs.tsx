import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";

export default function Docs() {
    const [markdown, setMarkdown] = useState("");

    useEffect(() => {
        fetch("/docs.md")
            .then((res) => res.text())
            .then((text) => setMarkdown(text))
            .catch((err) => console.error(err));
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Card className="p-8 prose prose-invert max-w-none bg-white/5 backdrop-blur-sm">
                <ReactMarkdown
                    components={{
                        h1: ({ children }) => (
                            <h1 className="text-4xl font-bold mb-8 text-white border-b border-violet-500/30 pb-4">
                                {children}
                            </h1>
                        ),
                        h2: ({ children }) => (
                            <h2 className="text-2xl font-bold mt-12 mb-6 text-white">
                                {children}
                            </h2>
                        ),
                        h3: ({ children }) => (
                            <h3 className="text-xl font-semibold mt-8 mb-4 text-violet-300">
                                {children}
                            </h3>
                        ),
                        p: ({ children }) => (
                            <p className="text-white/90 mb-6 leading-relaxed text-base">
                                {children}
                            </p>
                        ),
                        ul: ({ children }) => (
                            <ul className="list-disc ml-6 space-y-3 mb-6 text-white/90">
                                {children}
                            </ul>
                        ),
                        li: ({ children }) => (
                            <li className="text-white/90">
                                {children}
                            </li>
                        ),
                        code: ({ children, className }) => (
                            <code className={`${className} bg-violet-950 text-violet-200 px-2 py-1 rounded-md font-mono text-sm`}>
                                {children}
                            </code>
                        ),
                        pre: ({ children }) => (
                            <pre className="bg-violet-950 p-6 rounded-lg overflow-x-auto mb-6 text-violet-200 font-mono text-sm">
                                {children}
                            </pre>
                        ),
                        strong: ({ children }) => (
                            <strong className="font-semibold text-violet-300">
                                {children}
                            </strong>
                        ),
                        // Add styling for inline code blocks
                        inlineCode: ({ children }) => (
                            <code className="bg-violet-950 text-violet-200 px-2 py-1 rounded-md font-mono text-sm">
                                {children}
                            </code>
                        ),
                        // Add styling for blockquotes
                        blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-violet-500 pl-4 my-4 text-white/80 italic">
                                {children}
                            </blockquote>
                        ),
                    }}
                >
                    {markdown}
                </ReactMarkdown>
            </Card>
        </div>
    );
}