"use client";

import { FaGithub, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mt-8 p-6 text-center">
      <p className="text-xl font-bold text-gray-800">
        Feito por Leonardo Lopes
      </p>
      <div className="flex justify-center items-center mt-4 space-x-6">
        <a
          href="https://github.com/lopesleo"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-gray-800 hover:text-blue-500 transition-colors"
        >
          <FaGithub size={28} />
          <span className="ml-2 font-medium">GitHub</span>
        </a>
        <a
          href="https://www.linkedin.com/in/leonardolopesalmeida/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-gray-800 hover:text-blue-500 transition-colors"
        >
          <FaLinkedin size={28} />
          <span className="ml-2 font-medium">LinkedIn</span>
        </a>
      </div>
    </footer>
  );
}
