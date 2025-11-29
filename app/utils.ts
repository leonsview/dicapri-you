export function validateLinkedInUrl(url: string): string {
  let normalizedUrl = url.trim();
  
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  try {
    new URL(normalizedUrl);
  } catch {
    throw new Error("Please enter a valid URL");
  }

  if (!normalizedUrl.includes("linkedin.com/in/")) {
    throw new Error("Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/username)");
  }

  return normalizedUrl;
}
