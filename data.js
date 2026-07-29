/* ==========================================================================
   data.js — single source of truth for all content.
   index.html, work.html, and the shared modal system all read from here
   so nothing is hardcoded twice.
   ========================================================================== */

const SITE_DATA = {

  profile: {
    name: "Aman Gour",
    // Cycled by the hero typing effect (types, pauses, deletes, moves to next).
    typingPhrases: ["Aman Gour", "a Learner", "a Hacker", "a Creator", "a Cyber Security Enthusiast"],
    tagline: "Full Stack Developer · Python Developer · Cybersecurity Enthusiast",
    bio: "Aspiring ethical hacker and forensics expert — driven by truth, precision, and curiosity. B.Tech Cybersecurity student at SVIT, Secunderabad (2024–2028).",
    email: "amangour5488@gmail.com",
    github: "https://github.com/AmanGour83",
    githubUser: "AmanGour83",
    linkedin: "https://www.linkedin.com/in/amangour-/",
    whatsapp: "https://wa.me/+918125267557",
    resume: "Resuma/Aman_Gour_Resume.pdf",
    tryhackmeProfile: "https://tryhackme.com/p/demonslave738"
  },

  skills: [
    "Python", "HTML", "CSS & Bootstrap", "JavaScript", "Networking",
    "Basics of Kali", "Git & GitHub", "Nmap / Zenmap", "Wireshark",
    "BurpSuite", "Metasploit", "API Security (OWASP)", "PortSwigger"
  ],

  // ---- Projects -----------------------------------------------------------
  // id: stable key used for modal lookups + deep links (?item=id)
  // recent: true => eligible for the curated home strip
  projects: [
    // GhostMode ON
    {
      id: "ghostmode-on",
      icon: "👻",
      title: "GhostMode ON",
      date: "2026",
      summary: "A Flask web app that hides encrypted secrets inside images and audio using AES-256 steganography, with a full drag-and-drop UI.",
      description: "A full-stack Flask web application for concealing secret messages inside images and audio files using LSB (Least Significant Bit) steganography. Every payload is compressed with zlib, encrypted with AES-256-CBC (key derived via PBKDF2-HMAC-SHA256), and embedded at randomized bit positions seeded from the user's password — with SHA-256 integrity verification on extraction to detect tampering or corruption. Built with a custom glassmorphic dark-mode UI featuring drag-and-drop uploads, live encoding/decoding feedback, and support for common image (PNG, JPG, BMP, WEBP) and audio (WAV, MP3, FLAC, AAC) formats.",
      tech: ["Python", "Flask", "OpenCV", "PyCryptodome", "Bootstrap 5", "JavaScript"],
      github: "https://github.com/AmanGour83/GHOSTMODEON",
      demo: "https://ghostmodeon.onrender.com",
      recent: true
    },
      
    // Webcam Security Auditor
    {
      id: "webcam-security-auditor",
      icon: "🎥",
      title: "Webcam Security Auditor",
      date: "2026",
      summary: "A Windows desktop app that audits webcam permissions, detects live camera use, and lets you toggle per-app access.",
      description: "A Windows desktop app (Tkinter) that audits which applications have been granted webcam access, flags whether the camera is currently in use, and lets a user revoke or restore per-app permissions — built for a cybersecurity training program at Supraja Technologies. Scans both the HKCU and HKLM registry hives to correctly surface per-app consent on Windows 11, where earlier single-hive approaches missed it.",
      tech: ["Python", "Tkinter", "winreg", "OpenCV"],
      github: "https://github.com/AmanGour83/webcam-security-auditor",
      recent: true
    },
    //Network Mapper
    {
      id: "network-mapper",
      icon: "🌐",
      title: "Network Mapper",
      date: "2026",
      summary: "A Python tool for scanning and mapping network topology and discovering open ports.",
      description: "An advanced CLI port scanner built with zero external dependencies — host discovery via ping sweep, TTL-based OS fingerprinting, TCP/UDP scanning, SYN stealth probing, banner grabbing, risk-tagged results, and exportable CSV/JSON/HTML reports.",
      tech: ["Python"],
      github: "https://github.com/AmanGour83/Network-Mapper",
      recent: true
    },
    // Key Logger
    {
      id: "key-logger",
      icon: "⌨️",
      title: "Key Logger",
      date: "2026",
      summary: "A Python-based keylogger built for educational purposes to demonstrate cybersecurity concepts.",
      description: "A Python-based keylogger that captures keystrokes and saves them to a log file. Designed for educational purposes to demonstrate the importance of cybersecurity and ethical hacking practices.",
      tech: ["Python", "pynput", "datetime"],
      github: "https://github.com/AmanGour83/Key-Logger",
      recent: false
    },
    //Secret Cipher
    {
      id: "secret-cipher",
      icon: "🕵️",
      title: "Secret Cipher",
      date: "2025",
      summary: "A sleek Python tool for encoding and decoding messages using Caesar cipher logic.",
      description: "A sleek Python tool for encoding and decoding messages using Caesar cipher logic — built for secret notes or cryptography experiments with a friendly command-line interface.",
      tech: ["Python"],
      github: "https://github.com/AmanGour83/Secret_Cipher",
      recent: false
    },
    // Student Performance Tracker
    {
      id: "student-performance-tracker",
      icon: "📃",
      title: "Student Performance Tracker",
      date: "2025",
      summary: "A user-friendly Flask + SQLite web app for teachers and admins to track student performance and generate reports.",
      description: "A user-friendly Flask + SQLite web app for teachers and admins to track student performance, manage grades, and generate class reports — built to replace scattered spreadsheets with one simple dashboard.",
      tech: ["Python", "Flask", "SQLite", "HTML", "CSS", "Bootstrap"],
      github: "https://github.com/AmanGour83/student_performance_tracker",
      recent: false
    },
    // Expense Tracker
    {
      id: "expense-tracker",
      icon: "💸",
      title: "Expense Tracker",
      date: "2025",
      summary: "A simple command-line Python tool to log expenses, view summaries, and track spending.",
      description: "A simple command-line Python tool to log expenses, view summaries, and track spending — ideal for managing personal finances without spreadsheets or third-party apps.",
      tech: ["Python", "JSON", "datetime"],
      github: "https://github.com/AmanGour83/Expense_Tracers",
      recent: false
    },
    //Smart Resume
    {
      id: "smart-resume",
      icon: "📝",
      title: "Smart Resume",
      date: "2025",
      summary: "A professional web app that helps you craft beautiful, effective resumes with intelligent AI-powered guidance.",
      description: "A professional web app that helps you craft beautiful, effective resumes with intelligent AI-powered guidance. Built to walk a user from a blank page to a polished, ATS-friendly resume, with AI assistance suggesting phrasing and structure along the way.",
      tech: ["JavaScript", "HTML", "CSS", "Bootstrap", "Python", "Flask", "OpenAI API", "jsPDF"],
      github: "https://github.com/AmanGour83/SmartResumeAI",
      recent: false
    },
    // Result Desk
    {
      id: "result-desk",
      icon: "📊",
      title: "Result Desk",
      date: "2025",
      summary: "A Python CLI tool that loads CSV marksheets and visualizes student performance.",
      description: "A Python CLI tool that loads CSV marksheets and visualizes student performance — built for educators and data lovers who want quick, visual insight into a class's results without opening a spreadsheet.",
      tech: ["Python", "pandas", "numpy", "matplotlib", "CSV file"],
      github: "https://github.com/AmanGour83/Result-Desk",
      recent: false
    },
    // Registration Checkup
    {
      id: "registration-checkup",
      icon: "✅",
      title: "Registration Checkup",
      date: "2025",
      summary: "A command-line tool developed in Python to manage and update student details from a CSV file.",
      description: "A command-line tool developed in Python to manage and update student details from a CSV file. Designed for schools or educational institutions to maintain and review student information efficiently, without needing a database or web server.",
      tech: ["Python", "pandas", "numpy", "CSV file"],
      github: "https://github.com/AmanGour83/Regestration_check_up",
      recent: false
    }
  ],

  // ---- Internships (rendered as a zigzag timeline) -------------------------
  // `images`: gallery shown in the modal with < > navigation. Each internship
  // starts with its certificate. To add an Offer Letter or LOR image, push
  // another entry here, e.g.:
  //   { src: "Certificates/offer_letter/vois-offer.jpg", label: "Offer Letter" }
  //   { src: "Certificates/lor/vois-lor.jpg", label: "LOR" }
  // TODO(Aman): send the exact filenames in Certificates/offer_letter/ and
  // Certificates/lor/ and I'll wire them in per internship.
  internships: [
   //IDS internship
    {
      id: "ids",
      org: "Intuitive Data Solution Pvt Ltd (IDS)",
      role: "Information Security Intern",
      via: "",
      dates: "May 2026 – August 2026 (continuing)",
      description: "Information security internship covering hands-on offensive and defensive security practice — vulnerability assessment and penetration testing (VAPT), incident response, and implementation support for ISO 27001 controls.",
      tech: ["Python", "VAPT", "Offensive Security", "Defensive Security", "ISO 27001"],
      images: [
        {src:"Certificates/offer_letters/IDS_offer_letter_1.png", label: "Offer Letter(Page 1)"},
        {src:"Certificates/offer_letters/IDS_offer_letter_2.png", label: "Offer Letter(Page 2)"},
        {src:"Certificates/offer_letters/IDS_offer_letter_3.png", label: "Offer Letter(Page 3)"},
      ]
    },
    //CyArt internship
    {
      id: "cyart",
      org: "CyArt",
      role: "Red Team Cybersecurity Intern",
      via: "",
      dates: "April 2026 – continuing",
      description: "Red team internship running a full weekly attack-chain progression against an isolated lab environment (Kali Linux vs. Metasploitable2) — vulnerability assessment and exploitation with Metasploit, detection/response analysis via Wazuh, Suricata, and CrowdSec, and multi-phase engagements mapped to MITRE ATT&CK, culminating in a capstone adversary-emulation exercise covering C2 infrastructure and payload evasion.",
      tech: ["Kali Linux", "Metasploit", "Wazuh", "Suricata", "OpenVAS", "MITRE ATT&CK", "VAPT"],
      images: [
        {src:"Certificates/offer_letters/CyArt_offer_letter_1.png", label: "Offer Letter(Page 1)"},
        {src:"Certificates/offer_letters/CyArt_offer_letter_2.png", label: "Offer Letter(Page 2)"},
      ]
    },    
    //Supraja technologies internship
    {
      id: "supraja-technologies",
      org: "Supraja Technologies",
      role: "Cybersecurity Intern",
      via: "",
      dates: "February 2026 – July 2026",
      description: "Cybersecurity internship focused on defensive security for Windows environments — built a webcam security auditor that scans HKCU/HKLM registry hives to surface per-app camera permissions, detect live camera use in real time, and let users revoke or restore access from a password-gated desktop tool.",
      tech: ["Python", "Tkinter", "Windows Registry Auditing", "Defensive Security"],
      images: [
        { src: "Certificates/internship_certificate/Supraja_tech.png", label: "Certificate" },
        { src: "Certificates/lor/supraja_lor_1.png", label: "LOR" },
        { src: "Certificates/lor/supraja_lor_2.png", label: "LOR For Higher Studies" }
      ]
    },
    // VOIS internship
    {
      id: "vois",
      org: "VOIS (Vodafone Idea Foundation)",
      role: "Cybersecurity Virtual Internship",
      via: "via AICTE & Edunet Foundation",
      dates: "Mar 2026 – Apr 2026",
      description: "A virtual cybersecurity internship covering foundational defensive security practice, delivered through AICTE and the Edunet Foundation in partnership with the Vodafone Idea Foundation.",
      tech: ["Cybersecurity", "Defensive Security"],
      images: [
        { src: "Certificates/internship_certificate/VOIS.png", label: "Certificate" },
        { src: "Certificates/offer_letters/VOIS_OFFER_LETTER_1.png", label: "Offer Letter(Page 1)" },
        { src: "Certificates/offer_letters/VOIS_OFFER_LETTER_2.png", label: "Offer Letter(Page 2)" }
      ]
    },
    // Cyber War Labs internship
    {
      id: "cyber-war-labs",
      org: "Cyber War Labs",
      role: "Cybersecurity Internship",
      via: "",
      dates: "Mar 2026 – Apr 2026",
      description: "Hands-on cybersecurity internship covering both offensive and defensive practice, including vulnerability assessment and penetration testing (VAPT) exercises and capture-the-flag challenges.",
      tech: ["VAPT", "CTF", "Offensive Security", "Defensive Security"],
      images: [
        { src: "Certificates/internship_certificate/Cyber_warlabs.png", label: "Certificate" },
        { src: "Certificates/offer_letters/Cyberwarlab_Offer_Letter.png", label: "Offer Letter" }
      ]
    },
    //OASIS internship
    {
      id: "oasis",
      org: "OASIS",
      role: "Cybersecurity Internship",
      via: "",
      dates: "Feb 2025 – Mar 2025",
      description: "Cybersecurity internship covering network security fundamentals, penetration testing methodology, and incident response procedures.",
      tech: ["Network Security", "Penetration Testing", "Incident Response"],
      images: [
        { src: "Certificates/internship_certificate/OASIS_COMPLETION CERTIFICATE.jpg", label: "Certificate" },
        { src: "Certificates/internship_certificate/OASIS_sTAR_PERFORMER CERTIFICATE.jpg", label: "Star Performer Certificate" },
        {src: "Certificates/lor/OASIS_LOR.png", label: "LOR"  },
        {src: "Certificates/offer_letters/OASIS_offer_letter.png", label: "Offer Letter" }
      ]
    },
    // vaultsofcede internship
    {
      id: "vaultofcode",
      org: "ValutsOfCode",
      role: "Python Internship",
      via: "",
      dates: "Aug 2025 – Sep 2025",
      description: "Python-focused development internship building backend features with Flask and SQLite.",
      tech: ["Python", "Flask", "SQLite3"],
      images: [
        { src: "Certificates/internship_certificate/Vaultofcodes.jpg", label: "Certificate" },
        {src: "Certificates/offer_letters/Vaultofcodes_offer_letter.png", label: "Offer Letter" }
      ]
    },
    // elevate lab internship
    {
      id: "elevate-lab",
      org: "Elevate Lab",
      role: "Web Development Internship",
      via: "",
      dates: "May 2025 – Jun 2025",
      description: "Web development internship focused on building responsive front-end interfaces.",
      tech: ["HTML", "CSS & Bootstrap", "JavaScript"],
      images: [
        { src: "Certificates/internship_certificate/Elevate_Lab.jpg", label: "Certificate" },
        {src: "Certificates/offer_letters/ElevateLab_offer_letter.png", label: "Offer Letter" }
      ]
    }
  ],

  // ---- Course completion certificates (hover-flip grid) --------------------
  // `description`: shown in the shared modal when the card is clicked.
  // TODO(Aman): these are generic placeholders based on the course title —
  // personalize with what each course actually covered if you'd like.
  courseCertificates: [
    //Cyber Security 101 certificate
    { 
      id: "cyber-security-101", 
      title: "Cyber Security 101", 
      issuer: "Issued by TryHackMe.com", 
      image: "Certificates/course_Certificates/cyber security 101.png", 
      description: "A 13-module, 50+ hour hands-on path building on Pre Security — networking, Linux and Windows/Active Directory fundamentals, the command line, cryptography, exploitation basics, web hacking, and both offensive and defensive security tooling, including SOC operations and the OWASP Top 10." 
    },


    //Pre Security certificate by THM
    { 
      id: "pre-security", 
      title: "Pre Security", 
      issuer: "Issued by TryHackMe.com", 
      image: "Certificates/course_Certificates/pre security.png", 
      description: "TryHackMe's true beginner path — no prior experience assumed. Covers computer basics, an introduction to cyber security concepts, network fundamentals, how the web works, and Linux and Windows fundamentals, building the ground-floor knowledge needed before tackling offensive or defensive security work." 
    },

      //CEH certificate
    { 
      id: "ceh",
      title: "Certified Ethical Hacking [ CEH ]", 
      issuer: "Issued by TuteDude", 
      image: "Certificates/course_Certificates/TD_EH_AMAN-EH-1908.jpg", 
      description: "Covers core ethical hacking methodology — reconnaissance, scanning, exploitation, and reporting — following the CEH framework." 
    },

    //ACP certificate
    { 
      id: "acp", 
      title: "ACP Certificate", 
      issuer: "Issued by APISEC UNIVERSITY", 
      image: "Certificates/course_Certificates/ACP.jpg", 
      description: "APIsec University's Associate Certified Professional track, covering foundational API security concepts and practice." 
    },

    //API Security certificates
    { 
      id: "owasp-api", 
      title: "OWASP API Security", 
      issuer: "Issued by APISEC UNIVERSITY", 
      image: "Certificates/course_Certificates/OWASP API.jpg", 
      description: "Covers the OWASP API Security Top 10 — the most common vulnerability classes affecting modern APIs." 
    },

    // API Security certificates
    { 
      id: "securing-api", 
      title: "Securing API", 
      issuer: "Issued by APISEC UNIVERSITY", 
      image: "Certificates/course_Certificates/Securing API.jpg", 
      description: "Practical techniques for hardening APIs against common attack vectors." 
    },

    // API Security certificates
    { 
      id: "api-documentation", 
      title: "API Documentation", 
      issuer: "Issued by APISEC UNIVERSITY", 
      image: "Certificates/course_Certificates/APIDocumentation.jpg", 
      description: "Best practices for documenting APIs clearly and securely for consumers and auditors." 
    },

    // API Security certificates
    { 
      id: "api-sec-fundamentals", 
      title: "API Security Fundamentals", 
      issuer: "Issued by APISEC UNIVERSITY", 
      image: "Certificates/course_Certificates/API Sec Fundamental.jpg", 
      description: "Foundational concepts in API security — authentication, authorization, and common misconfigurations." 
    },

    // API Security certificates
    { 
      id: "api-authentication", 
      title: "API Authentication", 
      issuer: "Issued by APISEC UNIVERSITY", 
      image: "Certificates/course_Certificates/API Authentication.jpg", 
      description: "Covers authentication mechanisms for APIs, including tokens, keys, and common implementation pitfalls." 
    },

    //Diploma certificates in python
    { 
      id: "diploma-python", 
      title: "Diploma In Python", 
      issuer: "Issued by GEENI Computer Education, Nov 2020", 
      image: "Certificates/course_Certificates/DIPLOMA IN PYTHON CERTIFIATE.jpg", 
      description: "Foundational diploma covering core Python programming concepts." 
    },

    //Diploma certificates in ms-word
    { 
      id: "diploma-msword", 
      title: "Diploma In Ms-Word", 
      issuer: "Issued by GEENI Computer Education, Nov 2020", 
      image: "Certificates/course_Certificates/DIPLOMA IN MS-OFFICE CERTIFIATE.jpg", 
      description: "Foundational diploma covering Microsoft Word document creation and formatting." 
    }
  ],

  // ---- Co-curricular activities (achievement-unlock badges) ---------------
  // `learned`: shown in the modal alongside the certificate image.
  // TODO(Aman): these are generic placeholders — swap in your own specifics
  // (what you actually built/learned) whenever you get a chance.
  coCurricular: [
    // Shield 2.0 certificate
    { 
      id: "shield-2", 
      title: "Shield 2.0", 
      issuer: "Issued by Telangana Cyber Security Bureau", 
      image: "Certificates/Workshop_certificates/Shield2.0.jpeg", 
      learned: "Part of the Telangana Cyber Security Bureau's SHIELD conclave series — a large-scale cyber safety and security-awareness initiative bringing together students, IT professionals, and citizens for hands-on sessions on common online threats and safe digital practices." 
    },
    // IITH Workshop certificate
    { 
      id: "iith-workshop", 
      title: "IITH Workshop", 
      issuer: "Issued by IIT Hyderabad", 
      image: "Certificates/Workshop_certificates/IITH workshop.jpg", 
      learned: "A technical workshop hosted at IIT Hyderabad, offering hands-on exposure to current tools and techniques in the field." 
    },
    // AOC 2025 certificate
    { 
      id: "aoc-2025", 
      title: "Advent Of Cyber 2025", 
      issuer: "Issued by TryHackMe.com", 
      image: "Certificates/Workshop_certificates/AOC2025.png", 
      learned: "TryHackMe's annual Advent of Cyber event — a month of daily, hands-on beginner-to-intermediate security challenges covering topics like web exploitation, forensics, and threat hunting." 
    },
    // JNTUH Workshop certificate
    { 
      id: "jntuh-workshop", 
      title: "Cyber Security Workshop", 
      issuer: "Issued by Blue Team Cybersecurity, under JNTUH", 
      image: "Certificates/Workshop_certificates/JNTUH_WORKSHOAP.jpg", 
      learned: "A defensive-security-focused (Blue Team) workshop held under JNTUH, covering monitoring, detection, and incident response fundamentals." 
    }
  ]
};

if (typeof module !== "undefined") module.exports = SITE_DATA;