import { Github, Twitter } from "lucide-react"

export function Footer() {
    return (
        <footer className="w-full py-6 bg-transparent">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                        © 2024 aoYield. All rights reserved.
                    </div>
                    <div className="flex items-center space-x-4">
                        <a
                            href="https://github.com/ikunal-04/aoyield"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-violet-500 transition-colors duration-200"
                        >
                            <Github className="h-5 w-5" />
                        </a>
                        <a
                            href="https://twitter.com/kunalg_twt"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-violet-500 transition-colors duration-200"
                        >
                            <Twitter className="h-5 w-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}