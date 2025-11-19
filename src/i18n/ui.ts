export const languages: Record<'en', { name: string; flag: string }> = {
  en: { name: 'English', flag: 'us' },
} as const;

export const defaultLanguage = 'en';

export type LanguageCode = keyof typeof languages;

export const ui = {
  en: {
    projectsContent: {
      easyshop: {
        title: 'EasyShop',
        description:
          'An e-commerce application with a modern UI, secure checkout, and scalable backend—built with a DevOps mindset.',
        imageAltText: 'Screenshot of the EasyShop project',
        categoryText: 'E-commerce Platform',
        dateText: 'January 2025',
        detailedDescription:
          'EasyShop is a full-featured e-commerce solution focused on reliability and scalability. It includes product browsing, cart and checkout, order tracking, and admin management. Built with containerized services and CI/CD to streamline development and deployment.',
        keyFeatures: {
          responsiveDesign: {
            title: 'Responsive Design',
            description: 'Optimized shopping experience across mobile, tablet, and desktop.',
          },
          contentManagement: {
            title: 'Extensible Architecture',
            description:
              'Modular design with clear boundaries, ready for CMS or headless integrations.',
          },
          cicdPipeline: {
            title: 'CI/CD Automation',
            description:
              'Automated build, test, and deploy pipeline (Jenkins/GitHub Actions) with previews and checks.',
          },
          infrastructureAsCode: {
            title: 'Infrastructure as Code',
            description:
              'Provisioning and configuration using Terraform for repeatable, versioned environments.',
          },
          containerization: {
            title: 'Containerization',
            description:
              'Services packaged with Docker for consistent runtimes across dev and prod.',
          },
          kubernetesOrchestration: {
            title: 'Kubernetes Orchestration',
            description:
              'Scalable deployments, rolling updates, and self-healing using Kubernetes.',
          },
          observability: {
            title: 'Observability & Reliability',
            description:
              'Metrics, logs, and alerts to monitor uptime, performance, and user experience.',
          },
        },
        galleryImages: {
        },
        challenges:
          'Zero-downtime deployments for checkout flow, secrets management across environments, and scaling during promotional spikes.',
        learnings:
          'Applied IaC best practices, refined CI/CD with automated tests and rollbacks, and improved monitoring/alerting for user-impacting issues.',
      },
      chattingo: {
        title: 'Chattingo',
        description:
          'A real-time chat application built to practice modern web and DevOps workflows.',
        imageAltText: 'Screenshot of the Chattingo project',
        categoryText: 'Chat Application',
        dateText: 'January 2025',
        detailedDescription:
          'Chattingo enables one-to-one and group messaging with authentication and a responsive UI. The project emphasizes clean separation of services, containerized development, and automated delivery.',
        keyFeatures: {
          realtimeMessaging: {
            title: 'Real-time Messaging',
            description: 'Instant updates using websockets/streaming for smooth conversations.',
          },
          authentication: {
            title: 'Secure Authentication',
            description: 'Protected routes and user sessions for a safe chat experience.',
          },
        },
        galleryImages: {
          // screenshot1: { alt: 'Chattingo interface', caption: 'Main chat UI' },
        },
        challenges:
          'Managing connection lifecycle, scaling concurrent users, and reliable deployments.',
        learnings:
          'Improved understanding of realtime patterns, containerized dev flows, and CI/CD for quick iterations.',
      },
    },
    site: {
      title: 'Shaheen | DevOps & Cloud Engineer',
      description:
        'Portfolio of Shaheen, a DevOps and Cloud Engineer building reliable, scalable cloud-native systems.',
    },
    nav: {
      home: 'Home',
      blog: 'Blog',
      about: 'About',
      projects: 'Projects',
    },
    footer: {
      rights: 'All rights reserved.',
    },
    homePage: {
      pageTitle: 'Home | Shaheen - FullStack Developer',
      pageDescription:
        'Welcome to the portfolio of Shaheen, a FullStack developer passionate about creating innovative web experiences.',
      heroGreeting: "Hello, I'm Shaheen Nayyar",
      heroSubtitlePart1: 'DevOps Engineer',
      heroSubtitlePart2: 'DevOps Enthusiast',
      heroIntroduction:
        'Turning infrastructure complexity into streamlined, automated solutions.',
      heroViewWorkButton: "Let's Connect",
      heroContactButton: 'View Resume',
      heroImageAlt: 'Profile image of Shaheen',
      featuredProjectsTitle: 'Projects',
      featuredProjectsDescription:
        "Here are some of the projects I've worked on. Feel free to explore!",
      projectCardViewProject: 'View Project',
      projectCardViewCode: 'View Code',
      imageNotAvailable: 'Image not available for now',
      mySkillsTitle: 'My Skills',
      mySkillsDescription:
        'Explore the expertise and abilities that define my work and passion.',
    },
    blogPage: {
      pageTitle: 'My Technical Blog',
      pageDescription:
        'Articles and thoughts on web development, software architecture, and new technologies.',
      title: 'My Technical Blog',
      description:
        'Articles and thoughts on web development, software architecture, and new technologies.',
      comingSoon: 'Blog posts will appear here soon. Check back later!',
      heroImageAlt: 'Hero image for article: ',
      publishedOn: 'Published on: ',
      readMore: 'Read more',
      readingTimeSuffix: 'min read',
      searchPlaceholder: 'Search articles...',
      filterByTagButtonLabel: 'Filter by tag',
      noTagFound: 'No tag found.',
      selectTagCommandPlaceholder: 'Search tag...',
      allTagsLabel: 'All tags',
      noPostsFound: 'No posts found.',
    },
    blogPost: {
      publishedOn: 'Published on: ',
      updatedOn: 'Updated on: ',
      heroImageAlt: 'Hero image for article: ',
      backToList: 'Back to blog list',
      readingTimeSuffix: 'min read',
      relatedPostsTitle: 'Continue Reading',
      readMore: 'Read more',
    },
    toc: {
      title: 'Table of Contents',
    },
    aboutPage: {
      pageTitle: 'About Me',
      pageDescription:
        'Learn more about my background in DevOps and Cloud, and the projects I have delivered.',

      title: 'About Me',
      description:
        "I'm Shaheen Nayyar — a teacher turned DevOps learner passionate about building scalable, automated, and reliable systems. My teaching background helped me develop patience, clarity, and a love for simplifying complex ideas. I'm currently exploring tools like Docker, Kubernetes, Terraform, and Jenkins while documenting my learning journey.",
      whatWeDoTitle: 'What I Do',
      whatWeDoBody:
        'DevOps engineering focused on CI/CD (Jenkins ), containerization (Docker), Kubernetes orchestration, cloud architecture, automation. I simplify complex workflows and document my learning through real-world projects.',
    },
    projectDetailPage: {
      backToProjects: 'Back to Projects',
      categoryLabel: 'Category:',
      dateLabel: 'Date:',
      aboutTitle: 'About this project',
      keyFeaturesTitle: 'Key Features',
      galleryTitle: 'Gallery',
      challengesTitle: 'Challenges',
      learningsTitle: 'Learnings',
      visitProjectButton: 'Visit Project',
      viewCodeButton: 'View Code',
    },
    projectsPage: {
      title: 'My Projects',
      metaTitle: "My Projects | YOUR_NAME's Portfolio",
      metaDescription: "Discover all of YOUR_NAME's projects.",
      noProjects: 'No projects to display at the moment.',
      noProjectsDescription:
        "It seems that you don't have any projects to display at the moment.",
    },
    notFoundPage: {
      pageTitle: 'Page Not Found',
      title: 'Oops! Page Not Found',
      message:
        'Sorry, the page you are looking for does not seem to exist. Check the URL or return to the homepage.',
      homeLink: 'Return to Homepage',
    },
    zodErrors: {
      // Common errors
      invalid_type: 'Invalid type.',
      invalid_type_received_undefined: 'This field is required.', // For required fields (fallback)
      required_field_custom: 'The {fieldName} field is required.',
      // String errors
      too_small_string_minimum: 'Must be at least {minimum} characters long.',
      too_big_string_maximum: 'Must be no more than {maximum} characters long.',
      invalid_string_email: 'Invalid email address.',
      invalid_string_url: 'Invalid URL.',
      invalid_string_uuid: 'Invalid UUID.',
      // You can add more specific messages as needed
    },
  },
} as const;

export const getLanguageName = (lang: LanguageCode) => languages[lang];

export type UISchema = typeof ui;
export type FeatureType = keyof UISchema[typeof defaultLanguage];

export function useTranslations<F extends FeatureType>(
  _lang: LanguageCode | undefined,
  feature: F
) {
  const currentLanguage = defaultLanguage; // Force English-only

  // Get the available keys for this feature from the default language
  type AvailableKeys = keyof UISchema[typeof defaultLanguage][F];

  return function t(key: AvailableKeys): string {
    // Safely access the translation, falling back to default language if necessary
    const featureTranslations = ui[currentLanguage]?.[feature];
    if (featureTranslations && key in featureTranslations) {
      return featureTranslations[
        key as keyof typeof featureTranslations
      ] as string;
    }

    // Fallback to default language
    return ui[defaultLanguage][feature][
      key as keyof (typeof ui)[typeof defaultLanguage][F]
    ] as string;
  };
}
