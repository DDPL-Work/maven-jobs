export const JOBS = [
  {
    id: 1, title: "Senior Software Engineer", company: "TechCorp India", logo: "TC",
    rating: 4.5, reviews: "1.2K", exp: "3–6 Yrs", salary: "15–25 Lacs PA",
    location: "Bengaluru (Hybrid)", posted: "1 day ago", featured: true,
    desc: "Lead our core platform team. Architect scalable, high-performance solutions used by millions of Indian professionals every day.",
    tags: ["React", "Node.js", "AWS", "TypeScript"],
    dept: "Engineering", mode: "Hybrid", loc: "Bengaluru", salaryRange: "15+ Lakhs", type: "Foreign MNC", date: new Date(Date.now() - 86400000),
    jobHighlights: [
      "Bachelor's degree in Computer Science, proficiency in Java/Python/C++/JavaScript, strong knowledge of Data Structures & Algorithms and OOP",
      "Design, develop, test, and deploy scalable software applications; work on frontend, backend, or full-stack development; participate in code reviews and system design discussions"
    ],
    jobDescription: {
      aboutRole: "We are looking for a passionate Software Development Engineer (SDE) to design, develop, and maintain scalable software solutions. The ideal candidate should have strong problem-solving skills, a solid foundation in data structures & algorithms, and experience in building high-quality applications.",
      responsibilities: [
        "Design, develop, test, and deploy scalable software applications",
        "Write clean, maintainable, and efficient code",
        "Work on frontend, backend, or full-stack development based on project needs",
        "Collaborate with cross-functional teams (Product, QA, DevOps)",
        "Participate in code reviews and ensure best coding practices",
        "Debug and resolve technical issues and performance bottlenecks",
        "Contribute to system design and architecture discussions"
      ],
      requiredSkills: {
        programmingLanguages: ["Java / Python / C++ / JavaScript"],
        coreFundamentals: ["Data Structures & Algorithms", "Object-Oriented Programming (OOP)", "System Design (for experienced roles)"],
        webTechnologies: ["HTML, CSS, JavaScript", "React / Angular"],
        backend: ["Node.js / Java Spring Boot / Python Django"],
        databases: ["SQL (MySQL, PostgreSQL)", "NoSQL (MongoDB)"],
        tools: ["Git / GitHub", "REST APIs", "Cloud platforms (AWS / Azure / GCP good to have)"]
      },
      preferredQualifications: [
        "Bachelor's degree in Computer Science or related field",
        "Experience with scalable distributed systems",
        "Familiarity with Agile/Scrum methodology",
        "Strong analytical and problem-solving skills"
      ]
    },
    companyInfo: {
      about: "Deloitte LLP is a multinational professional services network, operating as one of the Big Four accounting firms. It offers a wide range of services including audit, consulting, financial advisory, risk advisory, tax, and legal services.",
      address: "32nd Floor, Tower 3, One International Center, Senapati Bapat Marg, Prabhadevi Railway Station, Elphinstone West, Mumbai, Maharashtra, 400013, MUMBAI, Maharashtra, India"
    }
  },
  {
    id: 2, title: "Product Designer (UI/UX)", company: "FinEdge", logo: "FE",
    rating: 4.2, reviews: "850", exp: "2–4 Yrs", salary: "12–18 Lacs PA",
    location: "Mumbai", posted: "3 days ago",
    desc: "Create the next generation of fintech product experiences. You will work alongside PMs and engineers to ship elegant, user-first designs.",
    tags: ["Figma", "UI/UX", "Prototyping", "Design Systems"],
    dept: "Design", mode: "Work from office", loc: "Mumbai", salaryRange: "10–15 Lakhs", type: "Startup", date: new Date(Date.now() - 86400000 * 3),
    jobHighlights: [
      "Expertise in Figma, Adobe XD, and other design tools",
      "Strong portfolio showcasing UI/UX projects for mobile and web apps",
      "Ability to create wireframes, prototypes, and high-fidelity designs"
    ],
    jobDescription: {
      aboutRole: "Join our design team to revolutionize how people manage their finances. You will lead the design process from research to final handoff.",
      responsibilities: [
        "Conduct user research and usability testing",
        "Create wireframes and prototypes for new features",
        "Design intuitive UI elements for our mobile app",
        "Maintain and evolve our design system"
      ],
      requiredSkills: {
        programmingLanguages: ["N/A"],
        coreFundamentals: ["User-Centered Design", "Information Architecture"],
        webTechnologies: ["HTML/CSS basics"],
        tools: ["Figma", "Sketch", "InVision"]
      }
    },
    companyInfo: {
      about: "FinEdge is a leading fintech startup focused on personal finance management.",
      address: "Bandra-Kurla Complex, Mumbai"
    }
  },
  // Adding more mock data for the details page
  {
    id: 3, title: "Backend Developer (Go / Python)", company: "CloudNine AI", logo: "CN",
    rating: 4.8, reviews: "320", exp: "1–3 Yrs", salary: "Not disclosed",
    location: "Pune", posted: "Just now",
    desc: "Build high-throughput AI services using Go and Python. Experience with distributed systems, microservices, and gRPC is a plus.",
    tags: ["Golang", "Python", "Kubernetes", "gRPC"],
    dept: "Engineering", mode: "Remote", loc: "Pune", salaryRange: "6–10 Lakhs", type: "Indian MNC", date: new Date()
  },
  {
    id: 4, title: "Full Stack Developer – Internship", company: "NovaSec", logo: "NS",
    rating: 4.0, reviews: "150", exp: "0–1 Yrs", salary: "4–6 Lacs PA",
    location: "Delhi / NCR", posted: "2 hours ago",
    desc: "Kickstart your career at a high-growth cybersecurity startup. Build secure web applications and ship production features from day one.",
    tags: ["JavaScript", "Express", "MongoDB", "React"],
    dept: "Engineering", mode: "Hybrid", loc: "Delhi / NCR", salaryRange: "3–6 Lakhs", type: "Startup", date: new Date(Date.now() - 7200000)
  },
  {
    id: 5, title: "Data Scientist", company: "DataPulse", logo: "DP",
    rating: 4.3, reviews: "700", exp: "2–5 Yrs", salary: "18–28 Lacs PA",
    location: "Bengaluru", posted: "5 hours ago",
    desc: "Build ML models that power analytics decisions for enterprise clients. Own the full lifecycle from data wrangling to deployment.",
    tags: ["Python", "ML", "TensorFlow", "SQL"],
    dept: "Engineering", mode: "Work from office", loc: "Bengaluru", salaryRange: "15+ Lakhs", type: "Corporate", date: new Date(Date.now() - 18000000)
  }
];

export const TOP_CATEGORIES = [
  "Head - Engineering Jobs", "Architect Jobs", "Game Developer / Programmer Jobs",
  "DevOps Manager Jobs", "Engineering Manager Jobs", "Database Administrator Jobs",
  "Android App Developer Jobs", "Full Stack Developer Jobs", "Data Scientist Jobs",
  "Product Manager Jobs"
];

// Expanded jobs for listing
export const EXTENDED_JOBS = [
  ...JOBS,
  ...Array.from({ length: 145 }, (_, i) => {
    const base = JOBS[i % JOBS.length];
    return {
      ...base,
      id: i + 6,
      title: `${base.title} ${Math.floor(i / 5) + 2}`,
      posted: `${i + 2} days ago`,
      featured: false,
      date: new Date(Date.now() - (i + 6) * 86400000),
      dept: i % 2 === 0 ? "Marketing" : "Sales",
      mode: i % 3 === 0 ? "Remote" : "Hybrid",
      loc: i % 4 === 0 ? "Hyderabad" : "Pune",
    };
  }),
];
