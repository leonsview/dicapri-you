// TypeScript interfaces for LinkedIn profile data

export interface LinkedInBirthday {
  day: string;
  month: string;
  year: string;
}

export interface LinkedInExperienceRaw {
  companyId?: string;
  companyUrn?: string;
  companyLink1?: string;
  companyName: string;
  companySize: string;
  companyWebsite: string;
  companyIndustry?: string;
  logo: string;
  title: string;
  jobDescription: string | null;
  jobStartedOn: string;
  jobEndedOn: string | null;
  jobLocation: string | null;
  jobStillWorking: boolean;
  jobLocationCountry: string;
  employmentType: string;
  subtitle?: string | null;
  caption?: string | null;
  metadata?: string | null;
}

export interface LinkedInExperienceClean {
  companyName: string;
  companySize: string;
  companyWebsite: string;
  logo: string;
  title: string;
  jobDescription: string | null;
  jobStartedOn: string;
  jobEndedOn: string | null;
  jobLocation: string | null;
  jobStillWorking: boolean;
  jobLocationCountry: string;
  employmentType: string;
}

export interface LinkedInSkillRaw {
  title: string;
}

export interface LinkedInEducation {
  companyId?: string;
  companyUrn?: string;
  companyLink1?: string;
  logo: string;
  title: string;
  subtitle: string;
  period: {
    startedOn: { year: number };
    endedOn: { year: number };
  };
  breakdown?: boolean;
}

export interface LinkedInLanguage {
  name: string;
  proficiency: string;
}

export interface LinkedInProfileRaw {
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string;
  connections: number;
  followers: number;
  jobTitle: string;
  jobStartedOn: string;
  jobLocation: string;
  jobStillWorking: boolean;
  companyName: string;
  companyIndustry: string;
  companyWebsite: string;
  companySize: string;
  currentJobDuration: string;
  addressWithCountry: string;
  profilePicHighQuality: string;
  backgroundPic: string;
  about: string;
  birthday: LinkedInBirthday;
  experiences: LinkedInExperienceRaw[];
  skills: LinkedInSkillRaw[];
  educations: LinkedInEducation[];
  languages: LinkedInLanguage[];
  [key: string]: unknown; // Allow additional fields that we'll ignore
}

export interface LinkedInProfileClean {
  linkedinUrl: string;
  firstName: string;
  lastName: string;
  fullName: string;
  headline: string;
  connections: number;
  followers: number;
  jobTitle: string;
  jobStartedOn: string;
  jobLocation: string;
  jobStillWorking: boolean;
  companyName: string;
  companyIndustry: string;
  companyWebsite: string;
  companySize: string;
  currentJobDuration: string;
  addressWithCountry: string;
  profilePicHighQuality: string;
  backgroundPic: string;
  about: string;
  birthday: LinkedInBirthday;
  experiences: LinkedInExperienceClean[];
  skills: string[];
  educations: LinkedInEducation[];
  languages: LinkedInLanguage[];
}

/**
 * Cleans a raw LinkedIn profile scrape by extracting only necessary fields
 */
export function cleanLinkedInProfile(
  raw: LinkedInProfileRaw
): LinkedInProfileClean {
  return {
    linkedinUrl: raw.linkedinUrl,
    firstName: raw.firstName,
    lastName: raw.lastName,
    fullName: raw.fullName,
    headline: raw.headline,
    connections: raw.connections,
    followers: raw.followers,
    jobTitle: raw.jobTitle,
    jobStartedOn: raw.jobStartedOn,
    jobLocation: raw.jobLocation,
    jobStillWorking: raw.jobStillWorking,
    companyName: raw.companyName,
    companyIndustry: raw.companyIndustry,
    companyWebsite: raw.companyWebsite,
    companySize: raw.companySize,
    currentJobDuration: raw.currentJobDuration,
    addressWithCountry: raw.addressWithCountry,
    profilePicHighQuality: raw.profilePicHighQuality,
    backgroundPic: raw.backgroundPic,
    about: raw.about,
    birthday: raw.birthday,
    experiences: raw.experiences.map((exp) => ({
      companyName: exp.companyName,
      companySize: exp.companySize,
      companyWebsite: exp.companyWebsite,
      logo: exp.logo,
      title: exp.title,
      jobDescription: exp.jobDescription,
      jobStartedOn: exp.jobStartedOn,
      jobEndedOn: exp.jobEndedOn,
      jobLocation: exp.jobLocation,
      jobStillWorking: exp.jobStillWorking,
      jobLocationCountry: exp.jobLocationCountry,
      employmentType: exp.employmentType,
    })),
    skills: raw.skills.map((skill) => skill.title),
    educations: raw.educations,
    languages: raw.languages,
  };
}

/**
 * Cleans an array of raw LinkedIn profiles
 */
export function cleanLinkedInProfiles(
  rawProfiles: LinkedInProfileRaw[]
): LinkedInProfileClean[] {
  return rawProfiles.map(cleanLinkedInProfile);
}
