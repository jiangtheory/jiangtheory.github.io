// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-research",
          title: "research",
          description: "We use molecular simulation and physical theory to understand soft materials. Our research also examines how physical knowledge and representation influence machine learning.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/research/";
          },
        },{id: "nav-team",
          title: "team",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/team/";
          },
        },{id: "nav-publications",
          title: "publications",
          description: "Publications are grouped by year. Use the topic buttons to filter, or the search bar to find specific papers.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-teaching",
          title: "teaching",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/teaching/";
          },
        },{id: "nav-resources",
          title: "resources",
          description: "Useful resources for students.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/resources/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "nav-open-positions",
          title: "open positions",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/opening/";
          },
        },{id: "news-the-jiang-group-is-officially-launching-at-the-university-of-south-carolina-sparkles",
          title: 'The Jiang Group is officially launching at the University of South Carolina! :sparkles:...',
          description: "",
          section: "News",},{id: "news-our-paper-range-aware-bayesian-optimization-for-discovering-diverse-designs-within-target-property-windows-is-now-published-in-digital-discovery-read-the-paper",
          title: 'Our paper, Range-Aware Bayesian Optimization for Discovering Diverse Designs within Target Property Windows,...',
          description: "",
          section: "News",},{id: "news-new-course-this-fall-eche-589-machine-learning-in-chemical-engineering-meets-mwf-10-50-11-40-am-learn-more",
          title: 'New course this fall. ECHE 589: Machine Learning in Chemical Engineering meets MWF...',
          description: "",
          section: "News",},{id: "news-welcome-to-our-founding-group-members-postdoctoral-researcher-joshua-ojih-and-phd-student-gauri-patil-meet-the-team",
          title: 'Welcome to our founding group members, postdoctoral researcher Joshua Ojih and PhD student...',
          description: "",
          section: "News",},{id: "news-our-review-representing-complex-polymers-for-machine-learning-is-now-published-in-mrs-bulletin-read-the-paper",
          title: 'Our review, Representing (complex) polymers for machine learning, is now published in MRS...',
          description: "",
          section: "News",},{id: "news-the-jiang-group-is-now-affiliated-with-the-carolina-institute-for-battery-innovation-cibi-at-the-university-of-south-carolina-where-we-bring-simulation-and-machine-learning-to-polymer-electrolytes-and-other-soft-materials-for-batteries-battery",
          title: 'The Jiang Group is now affiliated with the Carolina Institute for Battery Innovation...',
          description: "",
          section: "News",},{id: "teachings-eche-589-machine-learning-in-chemical-engineering",
          title: 'ECHE 589 - Machine Learning in Chemical Engineering',
          description: "",
          section: "Teachings",handler: () => {
              window.location.href = "/teaching/eche-589/";
            },},{
        id: 'social-cv',
        title: 'CV',
        section: 'Socials',
        handler: () => {
          window.open("/assets/pdf/jiang_cv.pdf", "_blank");
        },
      },{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%73%68%65%6E%67%6C%69@%6D%61%69%6C%62%6F%78.%73%63.%65%64%75", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/shengli-jiang-59500085", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/sjiang87", "_blank");
        },
      },{
        id: 'social-x',
        title: 'X',
        section: 'Socials',
        handler: () => {
          window.open("https://twitter.com/ShengliJiang", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=faN7n3oAAAAJ", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
